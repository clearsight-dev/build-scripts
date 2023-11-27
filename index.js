import shell from "shelljs";
import fs from "fs";
import dotenv from "dotenv";
import config from "./config/index.js";
import _ from "lodash";
import { downloadFromS3, uploadToS3 } from "./utils/s3/index.js";
import axios from "axios";
import path from "path";
import moment from "moment";

async function main() {
  /* THIS SCRIPT DOES THE FOLLOWING:

  1. GET BUILD_CONFIG from env and parse it as JSON
  2. Download Assets from S3,(build_config contains s3 paths for respective asset)
  3. Construct distribution.config.json by replacing uploader key with filepaths after download
  4. Replace distribution.config.json in ReactNativeTSProjeect/devops folder
  5. Run ./distribution.build.sh
  6. Once the build is generated upload to S3 and trigger webhook in Build Manager with build assets CDN Url

  *******!!!THIS SCRIPT ASSUMES ReactNativeTSProjeect is in the SAME DIRECTORY in which build-scripts are present**************

*/

  const platform = process.env.PLATFORM;
  const buildConfigString = process.env.BUILD_CONFIG;

  if (!buildConfigString || buildConfigString.trim() === "") {
    throw new Error("NO BUILD CONFIG PASSED IN ENV");
  }

  // Parse the trimmed JSON string

  const buildConfig =
    platform === "android"
      ? JSON.parse(decodeURIComponent(buildConfigString))
      : JSON.parse(buildConfigString);
  console.log(buildConfig);

  const currentWrkDir = path.resolve(process.cwd());

  const appId = _.get(buildConfig, "app_id", "");
  const build_android = _.get(buildConfig, "build_android", false);
  const build_ios = _.get(buildConfig, "build_ios", false);
  const appName = _.get(buildConfig, "app_name", null);
  const bundleName = _.get(buildConfig, "ios.bundle_id", null);

  console.log("Generating Bundle Identifiers....");

  if (build_ios) {
    console.log("Generating Bundle Identifiers....");
    const { createBundleIdentifier } = await import(
      "./utils/ios/createBundleId.js"
    );
    const { createBundleCapabilities } = await import(
      "./utils/ios/createBundleCapabilities.js"
    );
    const appBundleId = await createBundleIdentifier(appName, bundleName);
    const imageNotificationBundleId = await createBundleIdentifier(
      `${appName} Image Notification`,
      `${bundleName}.ImageNotification`
    );

    if (appBundleId) await createBundleCapabilities(appBundleId);

    if (imageNotificationBundleId)
      await createBundleCapabilities(imageNotificationBundleId);
  }

  console.log("Downloading Build Assets From S3...");

  const requiredFiles = ["icon_path", "splash_path", "service_file_path"];

  const fileNamesMap = {
    icon_path: "icon.png",
    splash_path: "splash.png",
  };

  if (build_android) {
    requiredFiles.push("store_file_path");
    fileNamesMap["store_file_path"] = "androidStoreFile.jks";
    fileNamesMap["service_file_path"] = "google-services.json";
  }

  if (build_ios) {
    fileNamesMap["service_file_path"] = "GoogleService-Info.plist";
  }

  await Promise.all(
    requiredFiles.map(async (key) => {
      const downloadPath = path.join(
        currentWrkDir,
        "assets",
        fileNamesMap[key]
      );

      // Download the files from S3

      await downloadFromS3(
        _.get(buildConfig, [platform, key]),
        downloadPath,
        config.buildAssetsBucket
      );

      // Replace Uploader Keys With Downloaded File Paths in distribution.config.json

      _.set(buildConfig, [platform, key], path.resolve(downloadPath));
    })
  );

  // Convert buildConfig to JSON string
  const buildConfigJSON = JSON.stringify(buildConfig, null, 2);

  // Write the build config to disk as distribution.config.json

  fs.writeFileSync(
    path.join(currentWrkDir, "assets", "distribution.config.json"),
    buildConfigJSON,
    "utf-8"
  );

  const projectPath = path.join(currentWrkDir, "..", "ReactNativeTSProjeect");

  const sourceFilePath = path.join(
    currentWrkDir,
    "assets",
    "distribution.config.json"
  );

  const destinationFilePath = path.join(projectPath, "devops");
  shell.cd(destinationFilePath);
  shell.cp("-f", sourceFilePath, destinationFilePath);

  console.log(`Generating Build for ${platform}`);

  try {
    shell.exec("./distribution.build.sh");

    const buildAssetsPath = path.join(projectPath, "build");

    if (!fs.existsSync(buildAssetsPath))
      throw Error("Android build result not found");

    shell.cd(projectPath);

    // ZIP THE BUILD ASSETS DOLDER

    shell.exec("zip -r build.zip build/");

    const currentTime = moment().format("MMMM_Do_YYYY_h_mm_ss").toLowerCase();

    const s3fileName = `${appId}/builds/Android_Build_${currentTime}.zip`;

    // UPLOAD THE BUILD ASSETS TO S3

    const uploaderKey = await uploadToS3(
      path.join(projectPath, "build.zip"),
      config.artifactsBucket,
      s3fileName
    );

    console.log(uploaderKey, "Uploader key");

    if (uploaderKey) {
      const artefactUrl = uploaderKey + ".com";

      //!! Remove this
      const webhook_url = buildConfig.ios.webhook_url.replace(
        /^https:/,
        "http:"
      );

      await axios.post(webhook_url, {
        success: true,
        artefactUrl,
      });
    } else {
      throw Error("Web Hook Failed to Apptile Server!!");
    }
  } catch (err) {
    console.log("Build Failed !!" + err.message);
    process.exit(1);
  }
}

main();
