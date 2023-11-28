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
  },
  slackWebHook: process.env.SLACK_BUILD_WEBHOOK,
};

export default config;
