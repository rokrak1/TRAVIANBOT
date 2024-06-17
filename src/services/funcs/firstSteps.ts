import { Page } from "puppeteer";
import { TravianAccountInfo } from "../../utils/CronManager";
import { loginIfNeccessary } from "../jobs/travianActions/login";

export const firstSteps = async (page: Page, configuration: TravianAccountInfo) => {
  const { travianDomain, travianUsername, travianPassword } = configuration;

  // Go to domain
  await page.goto(travianDomain);

  // Check if first page is rendered and login if not
  await loginIfNeccessary(page, travianUsername, travianPassword);
};
