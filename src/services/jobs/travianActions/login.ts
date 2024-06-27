import { Page } from "puppeteer";
import { LoggerLevels } from "../../../config/logger";
import { delay, randomBoundingBoxClickCoordinates } from "../../../utils";
import WindMouse from "../../funcs/windMouse";

export const login = async (page: Page, username: string, password: string) => {
  try {
    await page.waitForSelector('input[name="name"]');
  } catch (e) {
    await page.logger(LoggerLevels.ERROR, "waiting for login failed..");
    return;
  }

  const loginInput = await page.$('input[name="name"]');
  if (!loginInput) {
    await page.logger(LoggerLevels.ERROR, "login input not found..");
    return;
  }

  const loginInputBbox = await loginInput.boundingBox();
  if (!loginInputBbox) {
    await page.type('input[name="name"]', username);
    await page.logger(LoggerLevels.ERROR, "login input bounding box not found..");
    return;
  } else {
    const { x, y } = randomBoundingBoxClickCoordinates(loginInputBbox);
    await WindMouse.getInstance().mouseMoveAndClick(page, x, y);
    await delay(500, 700);
    await page.type('input[name="name"]', username);
  }

  await page.keyboard.press("Tab");
  await page.type('input[name="password"]', password);
  await delay(500, 700);
  await page.keyboard.press("Tab");
  await delay(400, 600);
  await page.keyboard.press("Enter");
};

export const loginIfNeccessary = async (page: Page, travianUsername: string, travianPassword: string) => {
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
