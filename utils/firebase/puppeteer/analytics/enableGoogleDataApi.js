// import { login } from "./googleLogin.js";

export async function enableGoogleDataAnalyticsApi(
  appName,
  projectId,
  options,
  page
) {
  // try {
  console.log("Enabling Google Data Analytics Api");
  const { skipLogin = false, browserLaunch = true } = options ?? {};

  // page = browserLaunch ? launchBrowser() : page;

  await page.goto(
    `https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com?hl=en&project=${projectId}`
  );

  // if (!skipLogin) {
  //   await login(page);
  // }

  await page.waitForSelector('button[aria-label="enable this API"]');

  await page.evaluate(() => {
    document
      .querySelectorAll('button[aria-label="enable this API"]')[1]
      .click();
  });

  await page.waitForSelector('button[aria-label="Disable API"]');

  return;
  // } catch (error) {
  //   if (
  //     error.message.includes(
  //       'Waiting for selector `button[aria-label="enable this API"]` failed: Waiting failed: 30000ms exceeded'
  //     )
  //   ) {
  //     console.log("Google Data Api is already Enabled");
  //   } else {
  //     console.log("Google Data Api Enabling Failed🔴");
  //     // errorLog(appName, projectId, error.message);
  //     console.log(error);
  //   }
  // }
}
