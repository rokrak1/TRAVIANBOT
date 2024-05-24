import { Page } from "puppeteer";

export const login = async (page: Page, username: string, password: string) => {
  await page.waitForSelector('input[name="name"]');
  await page.type('input[name="name"]', username);
  await page.type('input[name="password"]', password);
  //unselect mobile version
  //  await page.click('input[name="mobileOptimizations"');
  await page.click('button[type="submit"]');
};
