import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

export async function launchBrowser() {
  puppeteer.use(StealthPlugin());
  const browser = await puppeteer.launch({
    headless: true,

    userDataDir: "./user_data",
  });
  const pages = await browser.pages();
  const page = pages[0];
  return [browser, page];
}

// launchBrowser();
