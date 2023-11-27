// import { login } from "./googleLogin.js";

// import { launchBrowser } from "./launchBrowser.js";

import { delay } from "../../../../utils/index.js";

export async function enableAnalytics(appName, projectId, options, page) {
  try {
    console.log("Enabling Analytics");
    const { skipLogin = false, browserLaunch = true } = options ?? {};

    // if (!page) {
    //   let browser;
    //   [browser, page] = launchBrowser();
    // }
    // page = browserLaunch ? launchBrowser() : page;

    await page.goto(
      `https://console.firebase.google.com/project/${projectId}/analytics`
    );
    if (!skipLogin) {
      // await login(page);
    }

    const enableAnalyticsXpathExpression =
      '//*[text()="Enabling Google Analytics"]/ancestor::button';
    await page.waitForXPath(enableAnalyticsXpathExpression, {
      visible: true,
      timeout: 10000,
    });
    const [enableAnalyticsbutton] = await page.$x(
      enableAnalyticsXpathExpression
    );
    await delay(5000); //Without This the button is not painted on the screen and click action takes place early
    await enableAnalyticsbutton.click();

    await page.waitForSelector("#createProjectAnalyticsAccountInput", {
      visible: true,
    });

    await page.evaluate(() => {
      const button = document.querySelector(
        "#createProjectAnalyticsAccountInput"
      );
      button.click();
    });

    await delay(1000);

    const createNewAccountXpathExpression =
      '//*[text()="Create a new account"]/ancestor::button';
    await page.waitForXPath(createNewAccountXpathExpression, {
      visible: true,
    });
    const [addNewAccount] = await page.$x(createNewAccountXpathExpression);
    await delay(2000);
    addNewAccount.click();
    addNewAccount.click();

    await page.waitForSelector('input[type="text"]');
    await page.click('input[type="text"]');
    await page.type('input[type="text"]', `${appName}`);
    await page.waitForSelector('button[type="submit"]', {
      visible: true,
      enabled: true,
    });
    await page.click('button[type="submit"]');

    await page.click("input#mat-mdc-checkbox-1-input");
    await page.waitForSelector('button[type="submit"]', {
      visible: true,
      enabled: true,
    });

    await page.click('button[type="submit"]');
    const finishButtonXpath = '//*[text()="Finish"]/ancestor::button';
    await page.waitForXPath(finishButtonXpath, {
      visible: true,
      enabled: true,
    });
    const [finishButton] = await page.$x(finishButtonXpath);
    finishButton.click();

    console.log("Enabled Anlytics Succesfully");
  } catch (error) {
    if (
      error.message.includes(`Enabling Google Analytics"]/ancestor::button`) ||
      error.message.includes(
        'Waiting for selector `.//*[text()="Finish"]/ancestor::button` failed: Waiting failed: 30000ms exceeded'
      )
    ) {
      console.log("Analytics already exists!!");
      throw new Error("Analytics already exists!!");
    } else {
      console.log("Enabling Analytics Failed🔴");
      throw new Error(error);
      console.log(error);
    }
  }
}
