import { Page } from "puppeteer";
import { LoggerLevels } from "../../config/logger";

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
