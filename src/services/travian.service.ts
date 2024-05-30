import { delay } from "../utils";
import { startBuildingByPlan } from "./funcs/tasks";
import { clickNavigationSlot } from "./actions/clicker";
import { LoggerLevels, serverLogger } from "../config/logger";
import { TravianAccountInfo } from "../utils/CronManager";
import { PlanSingelton } from "./funcs/plan";
import { firstSteps } from "./funcs/firstSteps";
import { configureBrowser } from "./funcs/browserConfiguration";
import { JobResults } from "./cron.service";
import { fetchBotTypeAndPlan } from "./utils/database";
import { removeUserData } from "./utils";

enum BotType {
  VILLAGE_BUILDER = "VILLAGE_BUILDER",
  FARMER = "FARMER",
  OASIS_FARMER = "OASIS_FARMER",
}

export const travianStart = async (
  botId: string,
  configurations: TravianAccountInfo
) => {
  let browser;
  try {
    // Fetch bot type and plan if it's village builder
    let type: BotType;
    try {
      type = await fetchBotTypeAndPlan(botId);
    } catch (e) {
      await serverLogger(
        LoggerLevels.ERROR,
        `Error fetching bot type and plan: ${e}`
      );
      console.error(e);
      return;
    }

    // Launch Browser with configuration
    const { page, browser: currBrowser } = await configureBrowser(
      botId,
      configurations
    );
    browser = currBrowser;

    // First steps that should be done on Village builder
    if (type === BotType.VILLAGE_BUILDER) {
      await firstSteps(page, configurations);

      // Start building by plan
      const hasFinished = await startBuildingByPlan(
        page,
        PlanSingelton.getInstance().getPlan()
      );

      // If there are no constructions, stop the bot
      if (hasFinished) {
        await page.logger(
          LoggerLevels.INFO,
          "There are no constructions left..."
        );
        return JobResults.TERMINATE;
      }
    }

    // Do some random clicks to make it look more human (2 to 5 clicks)
    // TODO: Maybe this could be expanded to opening reports, checking other villages, etc.
    const randomClicks = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < randomClicks; i++) {
      await clickNavigationSlot(page);
      await delay(1100, 1900);
    }

    // Close browser
    await delay(3278, 5122);
  } catch (e) {
    console.error(e);

    // Remove user cache
    await removeUserData(botId);
    await serverLogger(LoggerLevels.ERROR, `Error starting bot: ${e}`);
  } finally {
    // Make sure to close the browser even if there is an error
    if (browser) {
      await browser.close();
    }
  }
};
