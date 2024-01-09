import { launchBrowser } from "./launchBrowser.js";
import { delay } from "../../index.js";

export async function uploadP12(projectId, p12Path, options, page) {
  try {
    const { skipLogin = false, browserLaunch = true } = options ?? {};

    const [browser, page] = await launchBrowser();

    await page.goto(
      `https://console.firebase.google.com/project/${projectId}/settings/cloudmessaging`
    );
    await delay(5000);

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
    return browser;
  } catch (error) {
    console.log("Error While Uploading P12", error);
  }
}

// uploadP12(
//   "nailmall-8059",
//   "/Users/yaswanth/Downloads/app-build-scripts/build-scripts/assets/g-marie-s-boutique-6571/output.p12"
// );
