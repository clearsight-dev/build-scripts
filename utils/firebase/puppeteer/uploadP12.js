import { login } from "./googleLogin.js";
import { successLog, log, delay, errorLog, updateTask } from "./utils.js";

import { launchBrowser } from "./launchBrowser.js";

export async function uploadP12(projectId, p12Path, options, page) {
  try {
    const { skipLogin = false, browserLaunch = true } = options ?? {};

    if (!page) {
      let browser;
      [browser, page] = await launchBrowser();
    }
    await page.goto(
      `https://console.firebase.google.com/project/${projectId}/settings/cloudmessaging`
    );
    const addKeyXpathExpression = '(//*[text()="Upload"]/ancestor::button)[2]';
    await page.waitForXPath(addKeyXpathExpression, {
      visible: true,
    });
    const [uploadButton] = await page.$x(addKeyXpathExpression);

    uploadButton.click();

    await page.waitForSelector("button.file-upload-browse-button");

    page.waitForFileChooser().then((fileChooser) => {
      // Upload a file by specifying its path
      return fileChooser.accept([p12Path]); // Replace with the actual file path
    });
    console.log("delay");

    await page.click("button.file-upload-browse-button");

    const SubmitUploadXpath = '(//*[text()="Upload"]/ancestor::button)[3]';
    const [SubmitUpload] = await page.$x(SubmitUploadXpath);
    SubmitUpload.click();

    console.log("clicked");
  } catch (error) {
    console.log("Error While Uploading P12", error);
  }
}
// uploadP12(
//   "body-mind-soul-connection7674",
//   "/Users/yaswanth/Downloads/customer-apps/Body-Mind&Soul-Connection/assets/ios/Certificates.p12"
// );
