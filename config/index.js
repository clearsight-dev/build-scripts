import path from "path";
import dotenv from "dotenv";
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const config = {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  buildAssetsBucket: process.env.BUILD_ASSETS_BUCKET,
  apiBaseUrl: process.env.API_BASE_URL,
  artifactsBucket: process.env.ARTIFACTS_BUCKET,
  buildCdnUrl: process.env.BUILD_CDN_URL,
  puppeteer: {
    userDataDir: process.env.USER_DATA_DIR ?? "",
  },
  appstore: {
    apiBaseUrl: "https://api.appstoreconnect.apple.com/v1",
    bundleCapabilities: [
      "ASSOCIATED_DOMAINS",
      "FONT_INSTALLATION",
      "PUSH_NOTIFICATIONS",
      "USERNOTIFICATIONS_TIMESENSITIVE",
    ],
    credentials: {
      apiKeyId: process.env.APPSTORE_API_KEY,
      issuerId: process.env.APPSTORE_ISSUER_ID,
      privateKeyPath: process.env.PRIVATE_KEY_PATH,
    },
    //contains uuid all the testers that are registered on appstoreconnect.com
    testers: [
      "80faa659-f894-45bd-ab14-4e0f7a9e4df8", //Saif Sadiq
      "81214a50-fcee-454e-b0f1-145693bb3483", //Rohith
      "813d6fb2-876f-4767-84f9-86329311426c", //Samyam
      "81c48205-4155-41a9-bf48-dcab007e109e", //Nikhil Yadav
      "81c90c67-91bc-49b6-a75b-80a58c8e9236", //launch@apptile.com
      "82b7d8b8-9646-4a94-a574-c66040fe7eb8", //Vishal
      "84964797-0e05-4ee1-84b4-5fdb192a442f", //Ankit
    ],
  },
  slackWebHook: process.env.SLACK_BUILD_WEBHOOK,
};

export default config;
