import { downloadServiceJSON } from "../utils/firebase/puppeteer/downloadServiceBaseFile.js";
import axios from "axios";
import config from "../config/index.js";
import path from "path";
import { randomUUID } from "crypto";

import { uploadToS3 } from "../utils/s3/index.js";

let isError = false;

try {
  const currentWrkDir = path.resolve(process.cwd());
  const projectId = process.env.FIREBASE_PROJECT_ID;
  var appId = process.env.APP_ID;
  var postWebhookData = {
    success: true,
    projectId,
    warnings: [],
    usingApptileAccount: true,
  };
  await downloadServiceJSON(projectId);
  const serviceAccountUUID = randomUUID();
  const serviceFilePath = path.join(
    currentWrkDir,
    "..",
    "assets",
    "firebaseServiceAccountKeyFile.json"
  );

  const serviceFileUploaderKey = await uploadToS3(
    serviceFilePath,
    config.buildAssetsBucket,
    `${appId}/firebaseServiceAccountKeyFile/${serviceAccountUUID}/firebaseServiceAccountKeyFile.json`
  );

  await uploadToS3(
    serviceFilePath,
    "prod-apptile-push-notifier-data",
    `appsConfigFiles/${appId}/serviceAccount.json`
  );

  postWebhookData["serviceAccountKeyFile"] = {
    assetId: serviceAccountUUID,
    assetClass: "firebaseServiceAccountKeyFile",
    fileName: "firebaseServiceAccountKeyFile.json",
    uploaderKey: serviceFileUploaderKey,
  };
} catch (err) {
  isError = true;
  console.log(err);
  postWebhookData["warnings"].push(
    "Generating Service Account Key Failed. Download it Manually"
  );
} finally {
  postWebhookData["success"] = !isError;
  await axios.post(
    `${config.apiBaseUrl}/build-manager/webhook/firebase/${appId}`,
    postWebhookData
  );
}
