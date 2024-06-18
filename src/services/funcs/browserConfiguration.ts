import puppeteer, { Browser } from "puppeteer";
import { createLogger } from "../../config/logger";
import { bypassRecaptcha } from "./bypassRecaptcha";

export const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";
const serverArgs = process.env.DEV_MODE ? [] : ["--no-zygote", "--single-process"];

interface BrowserConfiguration {
  proxyUsername?: string;
  proxyPassword?: string;
  botId: string;
}

export class BrowserInstance {
  private static instance: BrowserInstance;
  private browser: Browser | null = null;
  private browserConfiguration: BrowserConfiguration = {} as BrowserConfiguration;

  private constructor() {}

  public static getInstance(): BrowserInstance {
    if (!BrowserInstance.instance) {
      BrowserInstance.instance = new BrowserInstance();
    }
    return BrowserInstance.instance;
  }

  public async init(botId: string, proxyUsername?: string, proxyPassword?: string) {
    if (this.browser) {
      return;
    }

    this.browser = await puppeteer.launch({
      ...(process.env.DEV_MODE && { headless: false }),
      userDataDir: `./user_data/${botId}`,
      args: [`--window-size=1280,1024`, "--no-sandbox", "--disabled-setupid-sandbox", ...serverArgs],
      defaultViewport: {
        width: 1280,
        height: 1024,
      },
    });

    this.browserConfiguration = {
      botId,
      proxyUsername,
      proxyPassword,
    };
  }

  public async createPage() {
    if (!this.browser) {
      throw new Error("Browser is not initialized");
    }

    const { botId, proxyUsername, proxyPassword } = this.browserConfiguration;

    const page = await this.browser.newPage();

    await page.setUserAgent(userAgent);
    // Create new logger based on botId
    page.logger = await createLogger(botId);

    if (proxyUsername && proxyPassword) {
      // Set up proxy
      await page.authenticate({
        username: proxyUsername,
        password: proxyPassword,
      });
    }

    await page.setDefaultNavigationTimeout(0);

    // Bypass Recaptcha
    await bypassRecaptcha(page);

    return page;
  }

  public async closeBrowser() {
    if (this.browser && !process.env.DEV_MODE) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
