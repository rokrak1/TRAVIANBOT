import puppeteer from "puppeteer";
import { TravianAccountInfo } from "../../utils/CronManager";
import { createLogger } from "../../config/logger";
import { bypassRecaptcha } from "./bypassRecaptcha";

export const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";

export const configureBrowser = async (
  botId: string,
  configurations: TravianAccountInfo
) => {
  const { proxyDomain, proxyUsername, proxyPassword } = configurations;

  // Launch Browser
  const serverArgs = process.env.DEV_MODE
    ? []
    : ["--no-zygote", "--single-process"];
  const browser = await puppeteer.launch({
    ...(process.env.DEV_MODE && { headless: false }),
    userDataDir: `./user_data/${botId}`,
    args: [
      `--window-size=1280,1024`,
      `--proxy-server=${proxyDomain}`,
      "--no-sandbox",
      "--disabled-setupid-sandbox",
      // These flags are needed so there is launched only single process, otherwise application disconnects from chrome but keeps it running in the background
      ...serverArgs,
    ],
    defaultViewport: {
      width: 1280,
      height: 1024,
    },
  });

  const page = await browser.newPage();

  await page.setUserAgent(userAgent);
  // Create new logger based on botId
  page.logger = await createLogger(botId!);

  // Set up proxy
  await page.authenticate({
    username: proxyUsername,
    password: proxyPassword,
  });

  await page.setDefaultNavigationTimeout(0);

  // Bypass Recaptcha
  await bypassRecaptcha(page);

  return { browser, page };
};
