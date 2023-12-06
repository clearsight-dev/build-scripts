import { randomUUID } from "crypto";
import {
  writeLogToFile,
  makeProjectNameCompatible,
  generateProjectId,
} from "./utils/index.js";
import {
  createFirebaseProject,
  useFirebaseProject,
  createFirebaseApp,
  downloadFirebaseConfig,
  execute,
  logError,
} from "./utils/firebase/index.js";
import { enableAnalyticsPipeline } from "./utils/firebase/puppeteer/analytics/index.js";
import config from "./config/index.js";
import axios from "axios";
import { uploadToS3 } from "./utils/s3/index.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

import path from "path";
import moment from "moment";
import { downloadServiceJSON } from "./utils/firebase/puppeteer/downloadServiceBaseFile.js";
import { delay } from "./utils/index.js";
import {
  sendFirebaseFailureAlert,
  sendFirebaseSuccessAlert,
  sendSlackAlerts,
} from "./utils/slack/index.js";

const appId = process.env.APP_ID;
const appName = process.env.APP_NAME;
const bundleID = process.env.BUNDLE_ID;
let existingProjectId = process.env.EXISTING_PROJECT_ID;

const usingApptileAccount =
  process.env.usingApptileAccount === "true" ? true : false;

// let [, , appId, appName, bundleID, existingProjectId] = process.argv;

if (existingProjectId.trim() == "") existingProjectId = null;

const __filename = fileURLToPath(import.meta.url);
const currentWrkDir = dirname(__filename);

export let projectStage = {
  stage: "Beginning Firebase",
  success: true,
  Error_Message: "",
  Error_Detailed: "",
};

let postWebhookData = { success: true, warnings: [], usingApptileAccount };

try {
  var screenshotFileKey;
  var projectId = existingProjectId ?? generateProjectId(appName);
  console.log(projectId);

  console.log(`Checking If Project ${projectId} already exists ....`);

  const result = execute(
    `firebase projects:list | grep "${projectId}" || true`
  );

  if (existingProjectId && result.trim() === "") {
    throw new Error(
      "Couldn't find Existing Firebase Project or Customer Firebase's on Apptile Account"
    );
  }

  if (!existingProjectId && result.trim() === "") {
    projectStage.stage = "Creating A New Project";
    var projectName = makeProjectNameCompatible(appName);
    console.log(
      `Creating Firebase With Project Id ${projectId} & Project Name ${projectName}....`
    );
    createFirebaseProject(projectId, projectName);
  } else {
    console.log(`Skipping Project Id ${projectId} creation ...`);
  }

  projectStage.stage = "Using A Project";

  useFirebaseProject(projectId);

  createFirebaseApp("ANDROID", appName, bundleID);

  createFirebaseApp("IOS", appName, bundleID);

  console.log(
    "Waiting Period of 10secs ... for created config files to showup on firebase......"
  );

  await delay(10000);

  downloadFirebaseConfig("ANDROID");

  downloadFirebaseConfig("IOS");

  const androidConfigUUID = randomUUID();
  const iosConfigUUID = randomUUID();

  const androidUploaderKey = await uploadToS3(
    path.join(currentWrkDir, "assets", "google-services.json"),
    config.buildAssetsBucket,
    `${appId}/androidFirebaseServiceFile/${androidConfigUUID}/google-services.json`
  );

  postWebhookData["androidFirebaseServiceFile"] = {
    assetId: androidConfigUUID,
    assetClass: "androidFirebaseServiceFile",
    fileName: "google-services.json",
    uploaderKey: androidUploaderKey,
  };

  const iosUploaderKey = await uploadToS3(
    path.join(currentWrkDir, "assets", "GoogleService-Info.plist"),
    config.buildAssetsBucket,
    `${appId}/iosFirebaseServiceFile/${iosConfigUUID}/GoogleService-Info.plist`
  );

  postWebhookData["iosFirebaseServiceFile"] = {
    assetId: iosConfigUUID,
    assetClass: "iosFirebaseServiceFile",
    fileName: "GoogleService-Info.plist",
    uploaderKey: iosUploaderKey,
  };

  try {
    await enableAnalyticsPipeline(projectId, projectName);
  } catch (err) {
    // TODO: Add Log to AnaLytics
    console.log("Enabling Analytics Failed!! Enable it Manually!" + err);
    postWebhookData["warnings"].push(
      "Enabling Analytics Failed!! Enable it Manually!"
    );
  }

  try {
    await downloadServiceJSON(projectId);
    const serviceAccountUUID = randomUUID();
    const serviceFileUploaderKey = await uploadToS3(
      path.join(currentWrkDir, "assets", "firebaseServiceAccountKeyFile.json"),
      config.buildAssetsBucket,
      `${appId}/firebaseServiceAccountKeyFile/${serviceAccountUUID}/firebaseServiceAccountKeyFile.json`
    );

    postWebhookData["serviceAccountKeyFile"] = {
      assetId: serviceAccountUUID,
      assetClass: "firebaseServiceAccountKeyFile",
      fileName: "firebaseServiceAccountKeyFile.json",
      uploaderKey: serviceFileUploaderKey,
    };
  } catch (err) {
    console.log(err.errorMessage);
    postWebhookData["warnings"].push(
      "Generating Service Account Key Failed. Download it Manually"
    );
    const crashScreenshotName = `${appId}/puppeteerScreenshots/${moment()
      .format("MMMM_Do_YYYY_h_mm_ss")
      .toLowerCase()}.png`;

    screenshotFileKey = await uploadToS3(
      err.errorScreenshotPath,
      config.buildAssetsBucket,
      crashScreenshotName
    );
  }
} catch (error) {
  const errorMessage =
    (error.stdout ?? "") +
    (error.stderr ?? "") +
    (error.message ?? "") +
    (error.stack ?? "");
  projectStage.Error_Detailed = errorMessage;

  const logFileName = `${appId}/logs/firebase/${moment()
    .format("MMMM_Do_YYYY_h_mm_ss")
    .toLowerCase()}_logs.txt`;

  writeLogToFile(
    errorMessage,
    projectStage.stage,
    path.join(currentWrkDir, "assets")
  );

  const logFileKey = await uploadToS3(
    path.join(currentWrkDir, "assets", "logs.txt"),
    config.buildAssetsBucket,
    logFileName
  );

  console.log(logFileKey, "Log File Key");

  if (
    errorMessage.includes(
      "Couldn't find Existing Firebase Project or Customer Firebase's on Apptile Account"
    )
  ) {
    logError(
      `${errorMessage}. Check the Project Id or retry by providing a different project id!`
    );
  } else if (
    errorMessage.includes("project display name contains invalid characters")
  ) {
    logError(
      `Error with Firebase Project Name "${projectName}" during ${projectStage.stage}`
    );
  } else if (errorMessage.includes("project_id contains invalid characters")) {
    logError(
      `Error with Firebase Project ID "${projectId}" during ${projectStage.stage}`
    );
  } else if (errorMessage.includes("Request contains an invalid argument")) {
    logError(
      `Error with Bundle Identifier "${bundleID}" during ${projectStage.stage}. Change the bundle identifier and try again!`
    );
  } else if (
    errorMessage.includes("has multiple apps, must specify an app id.")
  ) {
    if (
      projectStage.stage === "Downloading ANDROID CONFIG FILE" ||
      projectStage.stage === "Downloading IOS CONFIG FILE"
    ) {
      logError(
        `Error during ${projectStage.stage}. Multiple Android apps exist. To resolve this, download the Service JSON file for "${bundleID}" and manually upload it`
      );
    }
  } else {
    console.log(errorMessage);
    projectStage.Error_Message = "Unidentified Error. Check Logs!";
  }

  postWebhookData = {
    ...postWebhookData,
    success: false,
    projectId,
    errors: {
      message: projectStage.Error_Message,
      logFileKey,
    },
  };
}

console.log(postWebhookData);

await axios.post(
  `${config.apiBaseUrl}/build-manager/webhook/firebase/${appId}`,
  postWebhookData
);
const alertMessage = postWebhookData["success"]
  ? sendFirebaseSuccessAlert(
      appName,
      projectId,
      postWebhookData["warnings"],
      screenshotFileKey
    )
  : sendFirebaseFailureAlert(
      appName,
      projectStage.Error_Message + "   " + projectStage.Error_Detailed
    );

await sendSlackAlerts(alertMessage);

if (projectStage.Error_Message) process.exit(1);
else process.exit(0);
