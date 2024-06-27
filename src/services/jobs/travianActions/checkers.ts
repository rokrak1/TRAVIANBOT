import { Page } from "puppeteer";
import { checkIfDailyQuestCompleted, checkIfQuestCompleted } from "../villageBuilder/quests";
import { goToClosestAdventureIfExsists, levelupHero } from "./hero";
import { extendGoldPlanAndResources } from "./gold";
import { extendProtection } from "./protection";

export const basicGameRoutines = async (page: Page) => {
  const firstStepsArray = [
    // Check if there is any adventure and start it
    //goToClosestAdventureIfExsists,
    // Check daily quest and collect it
    checkIfDailyQuestCompleted,
    // Check if there is any quests completed and collect rewards
    checkIfQuestCompleted,
  ];

  // Shuffle first steps so it's not always the same
  const shuffledFirstSteps = firstStepsArray.sort(() => Math.random() - 0.5);
  for (const step of shuffledFirstSteps) {
    await step(page);
  }

  // Level up hero if possible
  await levelupHero(page);

  // Extend gold plan and resources
  await extendGoldPlanAndResources(page);

  await extendProtection(page);
};
