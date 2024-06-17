import { delay } from "../utils";
import { clickNavigationSlot } from "./jobs/travianActions/clicker";
import { LoggerLevels, serverLogger } from "../config/logger";
import { TravianAccountInfo } from "../utils/CronManager";
import { firstSteps } from "./funcs/firstSteps";
import { BrowserInstance } from "./funcs/browserConfiguration";
import { BotType } from "./utils/database";
import { removeUserData } from "./utils";
import { startVillageBuilder, startFarmer, startOasisFarmer } from "./jobs";
import { OasisAdditionalConfiguration } from "./jobs/oasisFarmer/types";

export const travianStart = async (
  botId: string,
  configurations: TravianAccountInfo,
  additionalConfiguration?: OasisAdditionalConfiguration
) => {
  try {
    const { type } = configurations;

    if (!type) {
      await serverLogger(LoggerLevels.ERROR, `Bot type is not defined for botId: ${botId}`);
      return;
    }

    // Create new Browser with configuration
    const browser = BrowserInstance.getInstance();
    await browser.init(botId, configurations.proxyUsername, configurations.proxyPassword);
    const page = await browser.createPage();
    // First steps that should be done on every bot
    await firstSteps(page, configurations);
    // Proceed with bot type
    if (type === BotType.VILLAGE_BUILDER) {
      await startVillageBuilder(botId, page);
    } else if (type === BotType.FARMER) {
      await startFarmer(page);
    } else if (type === BotType.OASIS_FARMER) {
      await startOasisFarmer(page, additionalConfiguration || ({} as OasisAdditionalConfiguration));
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
    await BrowserInstance.getInstance().closeBrowser();
  }
};
