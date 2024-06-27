import { Page } from "puppeteer";
import { loginIfNeccessary } from "../jobs/travianActions/login";
import { TravianBotSettings } from "../../utils/CronManager";

export const firstSteps = async (page: Page, configuration: TravianBotSettings) => {
  const { travianDomain, travianUsername, travianPassword } = configuration;

  // Go to domain
  await page.goto(travianDomain);

  // Check if first page is rendered and login if not
  await loginIfNeccessary(page, travianUsername, travianPassword);
};
