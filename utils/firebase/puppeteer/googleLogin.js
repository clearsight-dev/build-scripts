import fs from "fs";
import process from "process";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export async function login(page, username, password) {
  await page.waitForSelector('input[type="email"]', { timeout: 0 });
  await page.type('input[type="email"]', username);
  // await page.type('input[type="email"]', username);
  //there is no unique identifier that doesnt change on their next button
  await page.click("div.FliLIb.FmFZVc");

  await page.waitForSelector('input[type="password"]', {
    timeout: 0,
    visible: true,
  });

  await page.type("input.whsOnd.zHQkBf", password);
  await page.click("div.FliLIb.FmFZVc");
  const cookies = await page.cookies();

  fs.writeFile("cookies.json", JSON.stringify(cookies), (error) => {
    if (error) {
      console.error("Error writing JSON data to file:", error);
    }
  });
}
