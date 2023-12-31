import shell from "shelljs";
import fs from "fs";
import config from "./config/index.js";
import _ from "lodash";
import { downloadFromS3, uploadToS3 } from "./utils/s3/index.js";
import axios from "axios";
import path from "path";
import moment from "moment";
import {
  sendSlackAlerts,
  generateBuildFailureAlert,
  generateBuildSuccessAlert,
} from "./utils/slack/index.js";

import { switchBranchOrTag, resetGITChanges } from "./utils/git/index.js";

import { generateJKS } from "./utils/android/generateJKS.js";
import {
  enablePublishFlow,
  updateMinFrameWork,
} from "./utils/publishFlow/index.js";

async function main() {
  try {
    //TODO: HANDLE MOST COMMON ERRORS WHILE EXECUTING distribution.sh

    /* THIS SCRIPT DOES THE FOLLOWING:

  1. GET BUILD_CONFIG from env and parse it as JSON
  2. Download Assets from S3,(build_config contains s3 paths for respective asset)
  3. Construct distribution.config.json by replacing uploader key with filepaths after download
  4. Replace distribution.config.json in ReactNativeTSProjeect/devops folder
  5. Run ./distribution.build.sh
  6. Once the build is generated upload to S3 and trigger webhook in Build Manager with build assets CDN Url

  *******!!!THIS SCRIPT ASSUMES ReactNativeTSProjeect is in the SAME DIRECTORY in which build-scripts are present**************

  */

    var platform = process.env.PLATFORM;
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
    const projectPath = path.join(currentWrkDir, "..", "ReactNativeTSProjeect");
    const destinationFilePath = path.join(projectPath, "devops");
    const buildTweaksPath = path.join(currentWrkDir, "utils", "build-tweaks");

    var appId = _.get(buildConfig, "app_id", "");
    var build_android = _.get(buildConfig, "build_android", false);
    var build_ios = _.get(buildConfig, "build_ios", false);
    var appName = _.get(buildConfig, "app_name", null);
    var bundleName = _.get(buildConfig, "ios.bundle_id", null);
    var webhook_url = _.get(
      buildConfig,
      `${platform.toLowerCase()}.webhook_url`,
      null
    );

    var publishOnApptile = _.get(buildConfig, "ios.publishOnApptile", false);

    //   const { apiKey: customerApiKey, issuerId: customerIssuerId } =
    //     buildConfig.ios;

    var version = _.get(
      buildConfig,
      `${platform.toLowerCase()}.version_number`,
      null
    );
    var semver = _.get(
      buildConfig,
      `${platform.toLowerCase()}.version_semver`,
      null
    );

    var branchOrTag = _.get(
      buildConfig,
      `${platform.toLowerCase()}.buildSourceGitHeadName`,
      "v0.13.0"
    );

    var minFrameworkVersion = _.get(
      buildConfig,
      `${platform.toLowerCase()}.minFrameworkVersion`,
      "v0.13.0"
    );

    var isBuildUploaded = false;

    shell.cd(projectPath);

    resetGITChanges(branchOrTag);

    switchBranchOrTag(branchOrTag);

    shell.cd(buildTweaksPath);

    shell.exec(`./tweaks.sh ${buildTweaksPath} ${projectPath}`);

    shell.cd(currentWrkDir);

    // if (build_ios && version !== "1" && semver !== "1.0.0") {
    //   buildConfig.ios.uploadToTestflight = true;
    //   const { apiKeyId: apptileApiKey, issuerId: apptileIssuerId } =
    //     config.appstore.credentials;

    //   const { apiKey: customerApiKey, issuerId: customerIssuerId } =
    //     buildConfig.ios;

    //   shell.env["apiKey"] = publishOnApptile ? apptileApiKey : customerApiKey;
    //   shell.env["apiIssuerId"] = publishOnApptile
    //     ? apptileIssuerId
    //     : customerIssuerId;
    // }

    console.log(buildConfig.ios);

    console.log("Downloading Build Assets From S3...");

    const requiredFiles = ["icon_path", "splash_path", "service_file_path"];

    let fileNamesMap = {
      icon_path: "icon.png",
      splash_path: "splash.png",
    };

    if (build_android) {
      fileNamesMap["service_file_path"] = "google-services.json";

      if (!buildConfig.android.store_file_path) {
        const { filePath, alias, password } = await generateJKS(appId, appName);
        buildConfig.android.store_file_path = filePath;
        buildConfig.android.key_alias = alias;
        buildConfig.android.store_password = password;
        buildConfig.android.key_password = password;
        console.log(buildConfig.android);
      } else {
        requiredFiles.push("store_file_path");
        const storeFilePathSuffix =
          buildConfig.android.store_file_path.includes("keystore")
            ? ".keystore"
            : ".jks";

        fileNamesMap = {
          ...fileNamesMap,
          store_file_path: `androidStoreFile${storeFilePathSuffix}`,
        };
      }
    }

    if (build_ios) {
      fileNamesMap["service_file_path"] = "GoogleService-Info.plist";

      if (!publishOnApptile) {
        requiredFiles.push("appStorePrivateKey");
        fileNamesMap["appStorePrivateKey"] = "appStorePrivateKey.p8";
      }
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

    if (build_ios && !publishOnApptile) {
      config.appstore.credentials.apiKeyId = _.get(
        buildConfig,
        "ios.apiKey",
        null
      );
      config.appstore.credentials.issuerId = _.get(
        buildConfig,
        "ios.issuerId",
        null
      );
      config.appstore.credentials.privateKeyPath = _.get(
        buildConfig,
        "ios.appStorePrivateKey",
        null
      );

      console.log(config.appstore.credentials);
    }

    if (build_ios && semver == "1.0.0" && version == "1") {
      console.log("Generating Bundle Identifiers....");
      const { createBundleIdentifier } = await import(
        "./utils/ios/bundleIds.js"
      );

      const { createBundleCapabilities } = await import(
        "./utils/ios/bundleCapabilities.js"
      );
      const appBundleId = await createBundleIdentifier(appName, bundleName);
      const imageNotificationBundleId = await createBundleIdentifier(
        `${appName} Image Notification`,
        `${bundleName}.ImageNotification`
      );

      const notificationContentBundleId = await createBundleIdentifier(
        `${appName} NotificationContentExtension`,
        `${bundleName}.NotificationContentExtension`
      );

      if (appBundleId) await createBundleCapabilities(appBundleId);

      if (imageNotificationBundleId)
        await createBundleCapabilities(imageNotificationBundleId);

      if (notificationContentBundleId)
        await createBundleCapabilities(notificationContentBundleId);

      // if (!publishOnApptile) {
      //   const { createProvisioningProfile } = await import(
      //     "./utils/ios/provisioningProfiles/index.js"
      //   );
      //   await createProvisioningProfile(
      //     appName,
      //     appBundleId,
      //     imageNotificationBundleId,
      //     notificationContentBundleId
      //   );
      // }
    }

    const sourceFilePath = path.join(
      currentWrkDir,
      "assets",
      "distribution.config.json"
    );

    shell.cd(destinationFilePath);
    shell.cp("-f", sourceFilePath, destinationFilePath);

    console.log(`Generating Build for ${platform}`);

    const result = shell.exec("./distribution.build.sh");

    // //!! Handle Most Common Android Errors
    // //!! Upload to S3 Logs for build system
    // //!! Try this in silent false

    console.log(result.code, "CODE");
    if (result.code !== 0) {
      if (result.stdout.includes("Error fetching app info"))
        throw new Error(
          "App needs to be Published atleast once inorder to build!"
        );
    }

    if (result.code === 0) {
      if (build_ios && result.stderr.includes("ARCHIVE FAILED")) {
        throw new Error(
          "Failed Because .entitlements files containing Appgroups .Build System Doesnt Support Appgroups for now! Remove that and try again!"
        );
      }
      //TODO: IMPROVE THIS LOGIC. NEED TO CHECK WETHER BUILD UPLOADED OR NOT FROM LOGS
      if (build_ios && result.stdout.includes("UPLOAD SUCCEEDED")) {
        isBuildUploaded = true;
        console.log("TESTFLIGHT UPLOAD SUCCEDED");
      }
    }

    const buildAssetsPath = path.join(projectPath, "build");

    if (!fs.existsSync(buildAssetsPath))
      throw Error(`${platform} Build Failed. Check Logs on Jenkins!`);

    shell.cd(projectPath);

    // ZIP THE BUILD ASSETS FOLDER

    shell.exec("zip -r build.zip build/");

    const currentTime = moment().format("MMMM_Do_YYYY_h_mm_ss").toLowerCase();

    const s3fileName = `${appId}/builds/${platform.toLowerCase()}/${appName}_${currentTime}.zip`;

    // UPLOAD THE BUILD ASSETS TO S3

    const uploaderKey = await uploadToS3(
      path.join(projectPath, "build.zip"),
      config.artifactsBucket,
      s3fileName
    );

    console.log(uploaderKey, "Uploader Key for S3 Bucket");

    if (uploaderKey) {
      const artefactUrl = encodeURI(config.buildCdnUrl + "/" + uploaderKey);
      console.log(artefactUrl);
      const alertMessage = generateBuildSuccessAlert(
        appName,
        platform,
        version,
        semver,
        artefactUrl
      );
      await sendSlackAlerts(alertMessage);

      await axios.post(webhook_url, {
        success: true,
        artefactUrl,
        uploaded: isBuildUploaded,
      });
    } else {
      throw Error("Web Hook Failed to Apptile Server!!");
    }

    await enablePublishFlow(appId);
    process.exit(0);
  } catch (err) {
    console.log("Build Failed !!" + err.stack ?? "");
    const alertMessage = generateBuildFailureAlert(
      appName,
      platform,
      version,
      semver,
      err.stack
    );
    await sendSlackAlerts(alertMessage);

    await axios.post(webhook_url, {
      success: false,
    });

    process.exit(1);
  }
}

main();
