import { getBundleIdByBundleName } from "./utils/ios/bundleIds.js";
import { generateCSR } from "./utils/ios/generateCSR.js";
import { uploadCertToPushNotification } from "./utils/ios/puppeteer/uploadCertToPushNotifcation.js";
import { generateP12 } from "./utils/ios/generateP12.js";
import { uploadP12 } from "./utils/firebase/puppeteer/uploadP12.js";
import fs from "fs";
import path from "path";
import { delay } from "./utils/index.js";
import config from "./config/index.js";
import { downloadFromS3, uploadToS3 } from "./utils/s3/index.js";
import axios from "axios";
import _ from "lodash";
import { generateIOSNotifAlert, sendSlackAlerts } from "./utils/slack/index.js";

let isError = false;
let Error_Message = "";

try {
  const configString = process.env.config;
  const config = JSON.parse(configString);
  console.log(config);
  var bundleName = _.get(config, "bundleIdentifier", null);
  var appName = _.get(config, "appName", null);
  var firebaseProjectId = _.get(config, `firebaseProjectId`, null);
  var webhook_url = _.get(config, "webhook_url", null);

  if (!firebaseProjectId || !bundleName) {
    throw new Error("Bundle Name or FireBase Project ID Not Found!!");
  }
  const currentWrkDir = path.resolve(process.cwd());

  const downloadPath = path.join(currentWrkDir, "assets", firebaseProjectId);

  fs.mkdirSync(downloadPath, { recursive: true });

  const bundleId = await getBundleIdByBundleName(bundleName);

  if (!bundleId) throw new Error("Bundle Id Not Found On Appstore");
  const { privateKeyPath, csrPath } = await generateCSR(downloadPath);

  console.log(privateKeyPath, csrPath, downloadPath);

  const cerPath = await uploadCertToPushNotification(
    bundleId,
    csrPath,
    downloadPath
  );
  console.log(privateKeyPath, csrPath, cerPath);

  const p12Path = generateP12(privateKeyPath, cerPath, downloadPath);
  console.log(p12Path);
  const browser = await uploadP12(firebaseProjectId, p12Path);
  await delay(6000);
  browser.close();
} catch (error) {
  isError = true;
  Error_Message =
    (error.stdout ?? "") +
    (error.stderr ?? "") +
    (error.message ?? "") +
    (error.stack ?? "");
  console.log(Error_Message);
} finally {
  const alertMessage = generateIOSNotifAlert(appName, isError, Error_Message);

  await sendSlackAlerts(alertMessage);

  await axios.post(webhook_url, { success: !isError });
}

export async function migrateServiceAccountToNotifierBucket(appId) {
  const { data } = await axios.get(
    `${config.apiBaseUrl}/build-manager/api/assets/${appId}`
  );
  let uploaderKey;
  for (const asset of data) {
    if (asset.assetClass == "firebaseServiceAccountKeyFile") {
      uploaderKey = asset.uploaderKey;
      break;
    }
  }
  if (!uploaderKey) {
    console.log(`Uploader Key Not Found!!! ${appId}`);
    return;
  }

  const currentWrkDir = path.resolve(process.cwd());

  const downloadPath = path.join(
    currentWrkDir,
    "assets",
    appId,
    "firebaseServiceAccountKeyFile.json"
  );

  await downloadFromS3(uploaderKey, downloadPath, config.buildAssetsBucket);

  const uploaderKey2 = await uploadToS3(
    downloadPath,
    "prod-apptile-push-notifier-data",
    `appsConfigFiles/${appId}/serviceAccount.json`
  );

  console.log(uploaderKey2);
}
