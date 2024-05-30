import { Page } from "puppeteer";
import { LoggerLevels, serverLogger } from "../../config/logger";
import { basicGameRoutines } from "../actions/checkers";
import { JobResults } from "../cron.service";
import { PlanSingelton } from "../funcs/plan";
import { startBuildingByPlan } from "../funcs/tasks";
import { fetchBotPlan } from "../utils/database";

export const startVillageBuilder = async (botId: string, page: Page) => {
  try {
    await fetchBotPlan(botId);
  } catch (e) {
    await serverLogger(
      LoggerLevels.ERROR,
      `Error fetching bot type and plan: ${e}`
    );
    console.error(e);
    return;
  }

  await basicGameRoutines(page);

  // Start building by plan
  const hasFinished = await startBuildingByPlan(
    page,
    PlanSingelton.getInstance().getPlan()
  );

  // If there are no constructions, stop the bot
  if (hasFinished) {
    await page.logger(LoggerLevels.INFO, "There are no constructions left...");
    return JobResults.TERMINATE;
  }
};
