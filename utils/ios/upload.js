import { downloadFile } from "../index.js";
import shell from "shelljs";
import path from "path";

async function uploadToTestflight(artefactUrl) {
  const currentWrkDir = path.resolve(process.cwd());

  const downloadPath = path.join(currentWrkDir, "..", "..", "assets");
  const ipaPath = path.join(downloadPath, "ipa.zip");

  console.log("Downloading IPA...");

  await downloadFile(artefactUrl, downloadPath, "ipa.zip");

  console.log("Extracting IPA....");
  shell.exec(`unzip -o ${ipaPath} -d ${downloadPath}`);
}

uploadToTestflight(
  "https://artefacts-demo.apptile.io/7372d278-dce5-4223-8d5d-1cae27a6b1ad/builds/ios/Nailmall%20Nail%20Supply_december_17th_2023_5_55_22.zip"
);
