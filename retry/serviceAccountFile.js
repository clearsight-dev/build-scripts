import { downloadServiceJSON } from "../utils/firebase/puppeteer/downloadServiceBaseFile.js";
import axios from "axios";
import config from "../config/index.js";
import path from "path";
import { randomUUID } from "crypto";

import { uploadToS3 } from "../utils/s3/index.js";
async function retryServiceAccountFile(projectId, appId) {
  let isError = false;
  var postWebhookData = {
    success: true,
    projectId,
    warnings: [],
    usingApptileAccount: true,
  };
  try {
    const currentWrkDir = path.resolve(process.cwd());

    await downloadServiceJSON(projectId);
    const serviceAccountUUID = randomUUID();
    const serviceFileUploaderKey = await uploadToS3(
      path.join(
        currentWrkDir,
        "..",
        "assets",
        "firebaseServiceAccountKeyFile.json"
      ),
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
}
