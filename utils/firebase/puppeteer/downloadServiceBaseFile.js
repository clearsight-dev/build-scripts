import fs from "fs";
import { launchBrowser } from "./launchBrowser.js";
import { delay } from "../../index.js";
import path from "path";
import { fileURLToPath } from "url";

export async function downloadServiceJSON(projectId) {
  try {
    console.log("Downloading Service Account Key File...");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const downloadPath = path.join(__dirname, "servicebase-file");
    var configFolderPath = path.join(__dirname, "../../../", "assets");

    var [browser, page] = await launchBrowser();

    await page.goto(
      `https://console.cloud.google.com/iam-admin/serviceaccounts?hl=en&project=${projectId}`
    );

    const client = await page.target().createCDPSession();
    // Set up download behavior to allow downloads and specify the download path
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath,
    });

    await page.waitForSelector("table a");
    const serviceAccountLink = await page.evaluate(() => {
      const serviceEmailHyperlink = document.querySelector("table a");
      return serviceEmailHyperlink.href;
    });

    const serviceLinkArray = serviceAccountLink.split("?");
    const serviceKeysHref = `${serviceLinkArray[0]}/keys?${serviceLinkArray[1]}`;
    await page.goto(serviceKeysHref);

    const addKeyXpathExpression = '//*[text()=" Add key "]/ancestor::button';
    await page.waitForXPath(addKeyXpathExpression, {
      visible: true,
    });

    const [addKeybutton] = await page.$x(addKeyXpathExpression);
    addKeybutton.click();

    await page.waitForSelector('cfc-menu-item[label="Create new key"]');
    await page.evaluate(() => {
      const createNewKey = document.querySelector(
        'cfc-menu-item[label="Create new key"]'
      );
      createNewKey.click();
    });

    const submitXpath = '//*[text()=" Create "]/ancestor::button';

    await page.waitForXPath(submitXpath, {
      visible: true,
    });

    const [submitbutton] = await page.$x(submitXpath);
    submitbutton.click();
    console.log("Service base file downloaded");

    await delay(10000);

    if (fs.existsSync(downloadPath)) {
      // Read the files in the source folder
      const files = fs.readdirSync(downloadPath);

      // Check if there are any files in the source folder
      if (files.length > 0) {
        // Take the first file from the source folder
        const sourceFilePath = path.join(downloadPath, files[0]);

        // Create the destination folder if it doesn't exist
        if (!fs.existsSync(configFolderPath)) {
          fs.mkdirSync(configFolderPath);
        }

        // Define the destination file path with the new name
        const destinationFilePath = path.join(
          configFolderPath,
          `firebaseServiceAccountKeyFile.json`
        );

        // Move the file
        fs.renameSync(sourceFilePath, destinationFilePath);
      }
      await browser.close();
    }
  } catch (error) {
    const crashScreenshotPath = path.join(
      configFolderPath,
      `${projectId}_serviceAccountFile_crashReport.png`
    );
    await page.screenshot({ path: crashScreenshotPath });

    throw {
      errorMessage: "Error while downloading Service Json File: \n" + error,
      errorScreenshotPath: crashScreenshotPath,
    };
  }
}
