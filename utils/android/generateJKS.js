import path from "path";
import { generateRandomPassword } from "../index.js";
import shell from "shelljs";
import { randomUUID } from "crypto";
import { uploadToS3 } from "../s3/index.js";
import config from "../../config/index.js";
import axios from "axios";

export async function generateJKS(appId, appName) {
  //TODO: META-DATA FROM APPTILE SERVER FETCH

  console.log("Generating JKS");

  const alias = appName.trim().split(" ").join("").toLowerCase();
  const password = generateRandomPassword(10);
  const currentWrkDir = path.resolve(process.cwd());

  const { data: metaData } = await axios.get(
    `${config.apiBaseUrl}/api/app/${appId}/build-metadata`
  );

  const country = metaData.country ?? "INDIA";
  const countryCode = metaData.countryCode ?? "IN";
  const organizationName = metaData.organizationName ?? "Apptile";

  const jksFilePath = path.join(currentWrkDir, "assets", `${alias}.jks`);

  const jksCommand = `keytool -genkey -v -keystore "${jksFilePath}" -keyalg RSA -keysize 2048 -validity 10000 -alias "${alias}" -storetype JKS -storepass "${password}" -keypass "${password}" -dname "cn=${country}, ou=${organizationName}, o=${organizationName}, c=${countryCode}"`;

  // CREATE JKS FILE
  const jksCommandResult = shell.exec(jksCommand, { silent: true });

  if (jksCommandResult.code == 1)
    throw new Error("Error Creating JKS" + "\n" + jksCommandResult.stdout);

  console.log(alias, "KEY-ALIAS");

  console.log(password, "KEY STORE PASSWORD");

  //TODO CRASH THE SCRIPT IF THE PASSWORD IS INVALID

  // CHECK THE PASSWORD OF KEYSTORE IS VALID OR NOT
  const androidStoreFileUUID = randomUUID();

  const checkWetherPasswordIsTrue = shell.exec(
    `keytool -list -keystore "${jksFilePath}" -storepass ${password}`,
    { silent: true }
  );

  if (checkWetherPasswordIsTrue.code == 1)
    throw new Error(
      "Error While Checking JKS With Created Password" +
        "\n" +
        checkWetherPasswordIsTrue.stdout
    );

  const s3fileName = `${appId}/androidStoreFile/${androidStoreFileUUID}/androidStoreFile.jks`;

  console.log("Uploading KeyStore File TO S3...");

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
