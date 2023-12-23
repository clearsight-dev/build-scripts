import { launchBrowser } from "../../firebase/puppeteer/launchBrowser.js";
import { delay } from "../../index.js";
import path from "path";
export async function uploadCertToPushNotification(
  bundleId,
  csrPath,
  downloadPath
) {
  try {
    const [browser, page] = await launchBrowser();
    const password = process.env.APPSTORE_CONNECT_PASSWORD;
    const currentWrkDir = path.resolve(process.cwd());
    // const downloadPath = path.join(currentWrkDir, "assets");

    console.log("Failed Before it was here");
    const identifierUrl = `https://developer.apple.com/account/resources/identifiers/bundleId/edit/${bundleId}`;

    await page.goto(identifierUrl);
    await delay(5000);
    // await page.waitForNavigation();

    const authFrameSelector = "#aid-auth-widget-iFrame";
    const frameElement = await page.$(authFrameSelector);

    const frame = await frameElement.contentFrame();

    const continueWithPasswordSelector = "#continue-password";
    await frame.waitForSelector(continueWithPasswordSelector);
    await frame.click(continueWithPasswordSelector);

    const passwordInputSelector = "#password_text_field";

    await frame.waitForSelector(passwordInputSelector);

    await frame.focus(passwordInputSelector);
    await page.keyboard.type(password);

    await clickSignInButton(frame);
    const client = await page.target().createCDPSession();
    // Set up download behavior to allow downloads and specify the download path
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath,
    });
    // Wait for the password input to appear
    console.log("here already");
    await page.waitForSelector("#PUSH_NOTIFICATIONS");

    const inputElement = await page.$("#PUSH_NOTIFICATIONS");
    const liElement = await page.$(
      'xpath=//li[.//*[@id="PUSH_NOTIFICATIONS"]]'
    );

    console.log(liElement);

    const configureButton = await liElement.evaluate((li) => {
      const buttons = li.querySelectorAll("button");
      for (const button of buttons) {
        if (button.innerText.includes("Configure")) {
          console.log(button, "dorikindi");
          button.click();
          return button;
        }
      }
      return null;
    });

    // Click on the Configure button if found
    if (configureButton) {
      await configureButton.click();
    } else {
      console.log("Configure button not found");
    }
    await page.waitForXPath('//button[contains(text(), "Create Certificate")]');

    const createCertificateButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons
        .filter((button) => button.innerText.includes("Create Certificate"))
        .map((button) => button.outerHTML);
    });

    // Click on the second button (index 1 in the array)
    if (createCertificateButtons.length >= 2) {
      await page.evaluate(() => {
        const secondButton = Array.from(
          document.querySelectorAll("button")
        ).filter((button) =>
          button.innerText.includes("Create Certificate")
        )[1];
        secondButton.click();
      });
    } else {
      console.log('Not enough "Create Certificate" buttons found');
    }

    page.waitForFileChooser().then(async (fileChooser) => {
      // Upload a file by specifying its path
      fileChooser.accept([csrPath]); // Replace with the actual file path

      await page.waitForSelector('button[type="submit"]');
      console.log("waited");
      await page.click('button[type="submit"]');
      console.log("clicked");

      // Wait for the anchor element with the download attribute to appear
      await page.waitForSelector("a[download]");

      // Click on the anchor element to trigger download
      await page.click("a[download]");
    });
    await page.waitForSelector('input[type="file"]');
    await page.click('input[type="file"]');
    await delay(5000);
    await browser.close();
    return `${downloadPath}/aps.cer`;
  } catch (error) {
    console.log(error);
  }
}

const clickSignInButton = async (frame) => {
  const element = await frame.waitForSelector(
    "#stepEl > sign-in > #signin > .container > #sign-in:not(disabled)"
  );
  await element.click();
};
