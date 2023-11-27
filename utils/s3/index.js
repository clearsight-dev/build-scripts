import fs from "fs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import config from "../../config/index.js";
import { Upload } from "@aws-sdk/lib-storage";

const s3client = new S3Client({
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

export const downloadFromS3 = async (key, location, bucketName) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const response = await s3client.send(command);
  const fileBuffer = await stream2buffer(response.Body);
  const directory = path.dirname(location);
  await fs.promises.mkdir(directory, { recursive: true });
  fs.writeFileSync(location, fileBuffer);
};

export const uploadToS3 = async (filePath, bucketName, fileName) => {
  const artefactUploadObj = new Upload({
    client: s3client,
    params: {
      Bucket: bucketName,
      Key: fileName,
      Body: fs.readFileSync(filePath),
    },
  });
  if (!artefactUploadObj) throw Error("Nothing to upload");
  const artefactUploadResponse = await artefactUploadObj.done();
  return artefactUploadResponse.Key;
};

export const stream2buffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const _buf = [];

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(err));
  });
};
