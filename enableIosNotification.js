import { getBundleIdByBundleName } from "./utils/ios/bundleIds.js";
import { generateCSR } from "./utils/ios/generateCSR.js";
import { uploadCertToPushNotification } from "./utils/ios/puppeteer/uploadCertToPushNotifcation.js";
import { generateP12 } from "./utils/ios/generateP12.js";
import { uploadP12 } from "./utils/firebase/puppeteer/uploadP12.js";
import fs from "fs";
import path from "path";
import { delay } from "./utils/index.js";

async function enableNotification(firebaseProjectId, bundleName) {
  const currentWrkDir = path.resolve(process.cwd());

  const downloadPath = path.join(currentWrkDir, "assets", firebaseProjectId);

  fs.mkdirSync(downloadPath, { recursive: true });

  const bundleId = await getBundleIdByBundleName(bundleName);

  console.log(bundleId, "THIS IS THE BUNDLE ID");
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
}
