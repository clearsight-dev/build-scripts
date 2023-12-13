import path from "path";
import { generateRandomPassword } from "../index.js";
import shell from "shelljs";
import { randomUUID } from "crypto";
import { uploadToS3 } from "../s3/index.js";
import config from "../../config/index.js";
import axios from "axios";

export async function generateJKS(appId, appName) {
  //TODO: META-DATA FROM APPTILE SERVER FETCH

  const alias = appName.trim().split(" ").join("").toLowerCase();
  const password = generateRandomPassword(10);
  const currentWrkDir = path.resolve(process.cwd());

  const jksFilePath = path.join(
    currentWrkDir,
    "..",
    "..",
    "assets",
    `${alias}.jks`
  );

  const jksCommand = `keytool -genkey -v -keystore "${jksFilePath}" -keyalg RSA -keysize 2048 -validity 10000 -alias "${alias}" -storetype JKS -storepass "${password}" -keypass "${password}" -dname "cn=india, ou=apptile, o=apptile, c=us"`;

  // CREATE JKS FILE
  shell.exec(jksCommand, { silent: false });

  console.log(alias, "KEY-ALIAS");

  console.log(password, "KEY STORE PASSWORD");

  //TODO CRASH THE SCRIPT IF THE PASSWORD IS INVALID

  // CHECK THE PASSWORD OF KEYSTORE IS VALID OR NOT
  const androidStoreFileUUID = randomUUID();

  shell.exec(
    `keytool -list -keystore "${jksFilePath}" -storepass ${password}`,
    { silent: false }
  );

  const s3fileName = `${appId}/androidStoreFile/${androidStoreFileUUID}/androidStoreFile.jks`;

  const uploaderKey = await uploadToS3(
    jksFilePath,
    config.buildAssetsBucket,
    s3fileName
  );

  await axios.post(
    `${config.apiBaseUrl}/build-manager/api/assets/${appId}/androidStoreFile`,
    {
      assetId: androidStoreFileUUID,
      password,
      keyAlias: alias,
      uploaderKey,
      fileName: "androidStoreFile.jks",
    }
  );

  console.log("Store File Key Uploaded With Uplaoder Key ", uploaderKey);

  return { uploaderKey, password, alias, filePath: jksFilePath };
}
