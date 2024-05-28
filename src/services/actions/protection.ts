import { Page } from "puppeteer";
import { delay } from "../../utils";
import { LoggerLevels } from "../../config/logger";

export const extendProtection = async (page: Page) => {
  const sidebarItems = await page.$$("#sidebarBoxInfobox li");
  console.log("extendProtection");
  console.log("sidebarItems.length", sidebarItems.length);
  for (let item of sidebarItems) {
    const itemText = await item.evaluate((el) => {
      return el.querySelector("button")?.textContent;
    });
    if (!itemText) continue;
    if (itemText.includes("Extend")) {
      console.log("itemText", itemText);
      const extendButton = await item.$("button");
      if (!extendButton) {
        await page.logger(LoggerLevels.ERROR, "No extend button found");
        return;
      }
      await extendButton.click();

      await delay(800, 1000);
      const confirmButton = await page.$("#dialogContent button.green");

      if (confirmButton) {
        console.log("found button");
        await confirmButton.click();
        await page.logger(LoggerLevels.PROTECTION, "Protection extended");
        await delay(800, 1000);
      } else {
        await page.logger(LoggerLevels.ERROR, "No confirm button found");
      }

      break;
    }
  }
};
