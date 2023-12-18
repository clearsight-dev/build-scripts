import axios from "axios";
import { uploadToTestflight } from "./utils/ios/upload.js";
import _ from "lodash";
import {
  generateUploadSuccessAlert,
  generateUploadFailureAlert,
  sendSlackAlerts,
} from "./utils/slack/index.js";

async function uploadBuild() {
  let isError = false;
  let Error_Message = "";

  try {
    var platform = process.env.PLATFORM;
    const uploadConfigString = process.env.UPLOAD_CONFIG;
    const uploadConfig = JSON.parse(uploadConfigString);

    console.log(uploadConfig);

    var build_ios = _.get(uploadConfig, "build_ios", false);
    var bundleName = _.get(uploadConfig, "ios.bundle_id", null);
    var appName = _.get(uploadConfig, "app_name", null);
    var version = _.get(
      uploadConfig,
      `${platform.toLowerCase()}.version_number`,
      null
    );
    var semver = _.get(
      uploadConfig,
      `${platform.toLowerCase()}.version_semver`,
      null
    );

    var artefactUrl = _.get(uploadConfig, "ios.artefactURL", null);
    var webhook_url = _.get(
      uploadConfig,
      `${platform.toLowerCase()}.webhook_url`,
      null
    );

    if (platform === "ios") {
      await uploadToTestflight(artefactUrl);

      if (build_ios && semver == "1.0.0" && version == "1") {
        const { createInternalTestFlight } = await import(
          "./utils/ios/testflight.js"
        );
        await createInternalTestFlight(bundleName);
      }
    }
  } catch (error) {
    isError = true;
    Error_Message =
      (error.stdout ?? "") +
      (error.stderr ?? "") +
      (error.message ?? "") +
      (error.stack ?? "");
  } finally {
    const alertMessage = isError
      ? generateUploadFailureAlert(
          appName,
          platform,
          version,
          semver,
          "Error While Uploading To Appstore" + "," + Error_Message
        )
      : generateUploadSuccessAlert(appName, platform, version, semver);
    await sendSlackAlerts(alertMessage);

    await axios.post(webhook_url, { success: !isError });
  }
}

uploadBuild();
