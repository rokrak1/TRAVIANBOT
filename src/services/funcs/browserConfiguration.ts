import puppeteer, { Browser, Page } from "puppeteer";
import { createLogger } from "../../config/logger";
import { bypassRecaptcha } from "./bypassRecaptcha";
import { Proxy, TravianBotSettings } from "../../utils/CronManager";
import { ProxySupabase } from "../../types/main.types";

export const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36";
const serverArgs = process.env.DEV_MODE ? [] : ["--no-zygote", "--single-process"];

interface BrowserConfiguration {
  botId: string;
  proxies: Proxy[];
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

  public async getPages() {
    return await this.browser!.pages();
  }

  private getAppropriateProxy(): Proxy {
    const proxies = this.browserConfiguration.proxies;
    const currentUtcHour = new Date().getUTCHours();

    for (const proxy of proxies) {
      const { from, to } = proxy.proxy_timezones;

      if (from <= to) {
        // Standard time range
        if (currentUtcHour >= from && currentUtcHour < to) {
          return proxy;
        }
      } else {
        // Wrap around time range
        if (currentUtcHour >= from || currentUtcHour < to) {
          return proxy;
        }
      }
    }

    return proxies[0];
  }

  public async init(botId: string, travianBotSettings: TravianBotSettings) {
    if (this.browser) {
      return;
    }

    this.browserConfiguration = {
      botId,
      proxies: travianBotSettings.proxies,
    };

    const { id: proxyId } = this.getAppropriateProxy();

    this.browser = await puppeteer.launch({
      ...(process.env.DEV_MODE && { headless: false }),
      userDataDir: `./user_data/${proxyId}`,
      args: [`--window-size=1920,1080`, "--no-sandbox", "--disabled-setupid-sandbox", ...serverArgs],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });

    // Return first page
    const pages = await this.browser.pages();
    return this.createPage(pages[0]);
  }

  public async createPage(existingPage?: Page) {
    if (!this.browser) {
      throw new Error("Browser is not initialized");
    }

    const { botId } = this.browserConfiguration;

    const { proxy_username, proxy_password } = this.getAppropriateProxy();

    const page = existingPage || (await this.browser.newPage());

    await page.setUserAgent(userAgent);
    // Create new logger based on botId
    page.logger = await createLogger(botId);

    if (proxy_username && proxy_password) {
      // Set up proxy
      await page.authenticate({
        username: proxy_username,
        password: proxy_password,
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
