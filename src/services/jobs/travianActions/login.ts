import { Page } from "puppeteer";
import { LoggerLevels } from "../../../config/logger";

export const login = async (page: Page, username: string, password: string) => {
  try {
    await page.waitForSelector('input[name="name"]');
  } catch (e) {
    await page.logger(LoggerLevels.ERROR, "waiting for login failed..");
    return;
  }
  await page.type('input[name="name"]', username);
  await page.type('input[name="password"]', password);
  //unselect mobile version
  //  await page.click('input[name="mobileOptimizations"');
  await page.click('button[type="submit"]');
};

export const loginIfNeccessary = async (
  page: Page,
  travianUsername: string,
  travianPassword: string
) => {
  const firstPage = await page.$("#resourceFieldContainer");
  if (!firstPage) {
    // Login
    await login(page, travianUsername, travianPassword);
    try {
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    } catch (e) {
      console.log("wait for navigation failed");
      await page.logger(LoggerLevels.ERROR, "waiting for navigation failed..");
      return;
    }
  }
};
