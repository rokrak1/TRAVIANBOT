import { Page } from "puppeteer";
import { LoggerLevels, serverLogger } from "../../config/logger";
import { basicGameRoutines } from "./travianActions/checkers";
import { JobResults } from "../cron.service";
import { PlanSingelton } from "../funcs/plan";
import { startBuildingByPlan } from "./villageBuilder/tasks";
import { VillageConfiguration, VillageConfigurationType } from "../../types/main.types";
import { selectVillage } from "../funcs/selectVillage";

export const startVillageBuilder = async (
  page: Page,
  configurationId: string,
  config: VillageConfigurationType[],
  village_configuration: VillageConfiguration
) => {
  try {
  } catch (e) {
    await serverLogger(LoggerLevels.ERROR, `Error fetching bot type and plan: ${e}`);
    console.error(e);
    return;
  }

  await basicGameRoutines(page);

  for (let i = 0; i < config.length; i++) {
    try {
      const plan = config[i];

      if (plan.village) {
        const villageExists = await selectVillage(page, plan.village);
        if (!villageExists) {
          throw new Error(`Village ${plan.village} not found for village: ${plan.village}`);
        }
      }

      PlanSingelton.createInstance(configurationId, village_configuration, i);
      // Start building by plan
      const hasFinished = await startBuildingByPlan(page, PlanSingelton.getInstance().getPlan());

      // If there are no constructions, stop the bot
      if (hasFinished) {
        await page.logger(LoggerLevels.INFO, `There are no constructions left for village ${plan.village}...`);
        return JobResults.TERMINATE;
      }
    } catch (e) {
      await serverLogger(LoggerLevels.ERROR, `Village builder error: ${e}`);
      console.error(e);
      return;
    }
  }
};
