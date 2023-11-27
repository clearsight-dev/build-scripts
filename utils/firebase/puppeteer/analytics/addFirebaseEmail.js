// import { login } from "./googleLogin.js";
import { delay } from "../../../../utils/index.js";

export async function getFirebaseEmail(appName, projectId, options, page) {
  // try {
  const taskName = "Adding Admin Role";

  const { skipLogin = false, browserLaunch = true } = options ?? {};

  // page = browserLaunch ? launchBrowser() : page;

  await page.goto(
    `https://console.cloud.google.com/iam-admin/iam?&hl=en&project=${projectId}`
  );

  if (!skipLogin) {
    // await login(page);
  }

  //!! Need to add an logic to click on edit button

  await page.waitForSelector("cfc-iam-edit-button>button");
  await page.evaluate(() => {
    const editButton = document.querySelector("cfc-iam-edit-button>button");
    editButton.click();
  });

  const firebaseEmail = await page.evaluate(() => {
    const matchingElements = [];
    const ddElements = document.querySelectorAll("dd");

    ddElements.forEach((dd) => {
      const textContent = dd.textContent.trim();

      if (textContent.startsWith("firebase-")) {
        firebaseEmail = textContent;
        matchingElements.push(textContent);
      }
    });

    return matchingElements[0];
  });

  await page.evaluate(() => {
    const spans = document.querySelectorAll("span");

    spans.forEach((span) => {
      if (
        span.textContent.trim() === "Add another role" &&
        span.innerHTML.includes("<!---->")
      ) {
        span.click();
      }
    });
  });

  await page.evaluate(() => {
    const spans = document.querySelectorAll("label");

    spans.forEach((span) => {
      if (
        span.textContent.trim() === "Add another role" &&
        span.innerHTML.includes("<!---->")
      ) {
        span.click();
      }
    });
  });

  await page.waitForXPath('//*[contains(text(), "Select a role")]', {
    visible: true,
  });
  const [elementWithText] = await page.$x(
    '//*[contains(text(), "Select a role")]'
  );
  elementWithText.click();

  await delay(1000);
  await page.keyboard.type("firebase admin");

  await delay(3000);
  await page.waitForSelector("mat-option");
  const matOptions = await page.$$("mat-option");
  await matOptions[0].click();

  const SaveXpathExpression = '//*[text()=" Save "]/ancestor::button';
  await page.waitForXPath(SaveXpathExpression, { visible: true });
  const [saveButton] = await page.$x(SaveXpathExpression);
  await saveButton.click();

  return firebaseEmail;
  // } catch (error) {
  //   console.log(appName, projectId, `Adding Firebase Admin Role Failed🔴`);
  //   console.error(error);
  //   throw new Error(error.message);
  // }
}

export async function addPropertyEmail(
  appName,
  projectId,
  firebaseEmail,
  options,
  page
) {
  // try {
  const { skipLogin = false, browserLaunch = true } = options ?? {};
  console.log(`Adding Email with Viewer Access`);

  page = browserLaunch ? launchBrowser() : page;
  await page.goto(
    `https://console.firebase.google.com/project/${projectId}/settings/integrations/analytics`
  );

  if (!skipLogin) {
    await login(page);
  }
  await page.waitForSelector("a.info-text.c5e-simple-link.c5e-external-link");
  // await page.click("a.info-text.c5e-simple-link.c5e-external-link");
  const url = await page.$eval(
    "a.info-text.c5e-simple-link.c5e-external-link",
    (element) => {
      return element.getAttribute("href");
    }
  );

  await page.goto(url + "/suiteusermanagement/property");

  await page.waitForSelector('button[guidedhelpid="suite-um-add-button"]');
  await page.evaluate(() => {
    console.log("in evaluate");
    const button = document.querySelector(
      'button[guidedhelpid="suite-um-add-button"]'
    );
    button.click();
  });

  await page.waitForSelector(
    'button[gtmtrigger="um-add-access-open-add-users"]'
  );
  await page.evaluate(() => {
    const addUsersButton = document.querySelector(
      'button[gtmtrigger="um-add-access-open-add-users"]'
    );
    addUsersButton.click();
  });

  await page.waitForSelector('input[placeholder="Enter email addresses"]');

  await page.keyboard.type(firebaseEmail);

  await page.waitForSelector('button[type="submit"]');

  await page.click('button[type="submit"]');
  console.log(`Successfully Added Users with Viewer Access`);
  // } catch (error) {
  //   console.log(`Adding Users with Viewer Access Failed🔴`);
  //   console.error(error);
  // }
}
