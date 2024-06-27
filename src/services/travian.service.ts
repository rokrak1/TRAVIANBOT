import { delay } from "../utils";
import { clickNavigationSlot } from "./jobs/travianActions/clicker";
import { LoggerLevels, serverLogger } from "../config/logger";
import { firstSteps } from "./funcs/firstSteps";
import { BrowserInstance } from "./funcs/browserConfiguration";
import { BotType } from "./utils/database";
import { removeUserData } from "./utils";
import { startVillageBuilder, startFarmer, startOasisFarmer } from "./jobs";
import WindMouse from "./funcs/windMouse";
import { installMouseHelper } from "../utils/fakeMouse";
import { randomInt } from "crypto";
import { FarmerConfigurationType, OasisFarmerConfigurationType, VillageConfigurationType } from "../types/main.types";
import { TravianBotSettings } from "../utils/CronManager";

export const travianStart = async (
  botId: string,
  travianBotSettings: TravianBotSettings,
  config: FarmerConfigurationType | OasisFarmerConfigurationType | VillageConfigurationType[]
) => {
  try {
    const { travianDomain, botType, configurationId, villageConfiguration } = travianBotSettings;

    // Create new Browser with configuration
    const browser = BrowserInstance.getInstance();
    console.log("BrowserInstance", browser);
    const page = await browser.init(botId, travianBotSettings);
    if (!page) {
      throw new Error("Page not found");
    }
    await installMouseHelper(page);
    await page.goto("https://www.travian.com/");
    await delay(1000, 2000);

    // Initialize WindMouse class
    const mouse = WindMouse.getInstance();
    mouse.init({
      startX: randomInt(0, 1920),
      startY: randomInt(0, 1080),
      endX: 0,
      endY: 0,
      gravity: 6.0,
      wind: 7,
      minWait: 5,
      maxWait: 15,
      maxStep: 6,
      targetArea: 1.0,
    });

    // First steps that should be done on every bot
    await firstSteps(page, travianBotSettings);
    console.log("BotType", botType, configurationId, config);
    // Proceed with bot type
    if (botType === BotType.VILLAGE_BUILDER) {
      await startVillageBuilder(page, configurationId, config as VillageConfigurationType[], villageConfiguration);
    } else if (botType === BotType.FARMER) {
      await startFarmer(page, config as FarmerConfigurationType);
    } else if (botType === BotType.OASIS_FARMER) {
      await startOasisFarmer(page, travianDomain, config as OasisFarmerConfigurationType);
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
    console.error("ERROR:", e);

    // Remove user cache
    await removeUserData(botId);
    await serverLogger(LoggerLevels.ERROR, `Error starting bot: ${e}`);
  } finally {
    // Make sure to close the browser even if there is an error
    await BrowserInstance.getInstance().closeBrowser();
  }
};
