import { generateCSR } from "../../../utils/ios/generateCSR.js";

import { generateP12 } from "../../../utils/ios/generateP12.js";

import fs from "fs";
import path from "path";

import { createDistributionCertificate } from "../generateIOSDistribution.js";
import generateProvisioningProfile from "./createProvisioningProfile.js";

export async function createProvisioningProfile(
  appName,
  bundleId,
  imageNotificationBundleId,
  notificationContentBundleId
) {
  const currentWrkDir = path.resolve(process.cwd());

  const downloadPath = path.join(
    currentWrkDir,
    "assets",
    appName.split(" ").join("-")
  );

  fs.mkdirSync(downloadPath, { recursive: true });

  const { privateKeyPath, csrPath } = await generateCSR(downloadPath);

  console.log(privateKeyPath, csrPath, downloadPath);

  const { certId, cerPath } = await createDistributionCertificate(
    csrPath,
    downloadPath
  );

  const p12Path = generateP12(
    privateKeyPath,
    cerPath,
    downloadPath,
    "Apptile123"
  );
  console.log(p12Path);

  await generateProvisioningProfile(
    appName,
    bundleId,
    "App-Provisioning-Profile",
    certId,
    downloadPath
  );

  await generateProvisioningProfile(
    appName,
    imageNotificationBundleId,
    "Image-Notification-Provisioning-Profile",
    certId,
    downloadPath
  );

  await generateProvisioningProfile(
    appName,
    notificationContentBundleId,
    "Notification-Content-Extenstion-Provisioning-Profile",
    certId,
    downloadPath
  );
}
