import "puppeteer";

declare module "puppeteer" {
  interface Page {
    logger: (level: string, message: string, additionalInfo?: object) => void;
  }
}
