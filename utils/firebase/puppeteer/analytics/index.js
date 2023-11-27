import { enableAnalytics } from "./enableAnalytics.js";
import { enableGoogleDataAnalyticsApi } from "./enableGoogleDataApi.js";
import { getFirebaseEmail, addPropertyEmail } from "./addFirebaseemail.js";
import { launchBrowser } from "../launchBrowser.js";
import { delay } from "../../../../utils/index.js";

export async function enableAnalyticsPipeline(projectId, appName) {
  const [browser, page] = await launchBrowser();

  await enableAnalytics(
    appName,
    projectId,
    { skipLogin: true, browserLaunch: false },
    page
  );
  await delay(3000);
  await enableGoogleDataAnalyticsApi(
    appName,
    projectId,
    { skipLogin: true, browserLaunch: false },
    page
  );
  await delay(3000);
  const firebaseEmail = await getFirebaseEmail(
    appName,
    projectId,
    { skipLogin: true, browserLaunch: false },
    page
  );
  await delay(3000);
  if (firebaseEmail) {
    await addPropertyEmail(
      appName,
      projectId,
      firebaseEmail,
      { skipLogin: true, browserLaunch: false },
      page
    );
  }
  await delay(10000);
  browser.close();
}
