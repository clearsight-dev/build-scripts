import { enableAnalytics } from "./enableAnalytics.js";
import { enableGoogleDataAnalyticsApi } from "./enableGoogleDataApi.js";
import { getFirebaseEmail, addPropertyEmail } from "./addFirebaseEmail.js";
import { launchBrowser } from "../launchBrowser.js";
import { delay } from "../../../../utils/index.js";

export async function enableAnalyticsPipeline(projectId, appName) {
  const [browser, page] = await launchBrowser();
  let Error_Message;
  let firebaseEmail;
  try {
    await enableAnalytics(
      appName,
      projectId,
      { skipLogin: true, browserLaunch: false },
      page
    );
  } catch (err) {
    Error_Message += err;
  }
  await delay(3000);
  try {
    await enableGoogleDataAnalyticsApi(
      appName,
      projectId,
      { skipLogin: true, browserLaunch: false },
      page
    );
  } catch (err) {
    Error_Message += err;
  }
  await delay(3000);

  try {
    firebaseEmail = await getFirebaseEmail(
      appName,
      projectId,
      { skipLogin: true, browserLaunch: false },
      page
    );
  } catch (err) {
    Error_Message += err;
  }
  await delay(3000);
  if (firebaseEmail) {
    try {
      await addPropertyEmail(
        appName,
        projectId,
        firebaseEmail,
        { skipLogin: true, browserLaunch: false },
        page
      );
    } catch (err) {
      Error_Message += err;
    }
  }
  await delay(10000);
  browser.close();

  if (Error_Message) {
    throw new Error(Error_Message);
  }
}
