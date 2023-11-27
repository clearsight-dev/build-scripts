import puppeteer from "puppeteer-extra";
import fs from "fs";
import config from "../../../config/index.js";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

export async function launchBrowser() {
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: config.puppeteer.userDataDir,
  });

  // console.log(fs.existsSync("/Users/yaswanth/user_dir"), "user_data exists");
  const pages = await browser.pages();
  const page = pages[0];
  // const cookiesPath = "cookies.json";
  // const previousSession = fs.existsSync(cookiesPath);
  // if (previousSession) {
  //   const content = fs.readFileSync(cookiesPath);
  //   const cookiesArr = JSON.parse(content);
  //   if (cookiesArr.length !== 0) {
  //     for (let cookie of cookiesArr) {
  //       await page.setCookie(cookie);
  //     }
  //     console.log("Session has been loaded in the browser");
  //   }
  // }

  return [browser, page];
}
// launchBrowser();
