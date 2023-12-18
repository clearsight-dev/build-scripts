import { downloadFile } from "../index.js";
import shell from "shelljs";
import path from "path";
import config from "../../config/index.js";

export async function uploadToTestflight(artefactUrl) {
  const currentWrkDir = path.resolve(process.cwd());

  const downloadPath = path.join(currentWrkDir, "..", "..", "assets");

  const ipaPath = path.join(downloadPath, "ipa.zip");
  const extractedPath = path.join(
    downloadPath,
    "build",
    "ReactNativeTSProject.ipa"
  );
  const { apiKeyId, issuerId } = config.appstore.credentials;

  console.log("Downloading IPA...");

  await downloadFile(artefactUrl, downloadPath, "ipa.zip");

  console.log("Extracting IPA....");

  shell.exec(`unzip -o ${ipaPath} -d ${downloadPath}`);

  console.log("UPLOADING IPA....");

  const result = shell.exec(
    `xcrun altool --upload-app -f "${extractedPath}" -t ios --apiKey ${apiKeyId} --apiIssuer "${issuerId}" --verbose`
  );
  console.log(result.code, "CODE");

  if (result.code == 1) {
    if (result.stderr.includes("ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE")) {
      console.log("here");
      throw new Error(
        "The following IPA with same version and semver has been already uploaded to appstore"
      );
    } else {
      throw new Error("Error While Uploading To Appstore!Check Logs!!");
    }
  }
}
