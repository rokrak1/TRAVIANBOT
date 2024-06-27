import { CronJob, CronTime } from "cron";
import { BotType } from "../services/utils/database";
import { VillageConfiguration } from "../types/main.types";

enum CronIntervals {
  ONE_MINUTE = "*/1 * * * *",
  TWO_MINUTES = "*/2 * * * *",
  THREE_MINUTES = "*/3 * * * *",
  FOUR_MINUTES = "*/4 * * * *",
  FIVE_MINUTES = "*/5 * * * *",
  SIX_MINUTES = "*/6 * * * *",
  SEVEN_MINUTES = "*/7 * * * *",
  EIGHT_MINUTES = "*/8 * * * *",
  NINE_MINUTES = "*/9 * * * *",
  TEN_MINUTES = "*/10 * * * *",
  FIFTEEN_MINUTES = "*/15 * * * *",
  HALF_HOUR = "*/30 * * * *",
  ONE_HOUR = "0 * * * *",
  TWO_HOURS = "0 */2 * * *",
  THREE_HOURS = "0 */3 * * *",
}

export interface Proxy {
  id: string;
  proxy_domain: string;
  proxy_username: string;
  proxy_password: string;
  proxy_timezones: {
    from: number;
    to: number;
  };
}

interface TravianBotSettings {
  travianUsername: string;
  travianPassword: string;
  travianDomain: string;
  configurationId: string;
  villageConfiguration: VillageConfiguration;
  botType: string;
  proxies: Proxy[];
}

export interface CronJobDetails {
  name: string;
  cron: CronJob;
  cronId: string;
  options: TravianBotSettings;
  interval: keyof typeof CronIntervals;
  botType: BotType;
}
export class CronManager {
  private static _instance: CronManager;
  private _jobs: { [key: string]: CronJobDetails } = {};

  private constructor() {}

  public static getInstance(): CronManager {
    if (!this._instance) {
      this._instance = new CronManager();
    }
    return this._instance;
  }

  add(
    name: string,
    configurationId: string,
    periodText: keyof typeof CronIntervals,
    botType: BotType,
    fn: () => void,
    options: TravianBotSettings
  ): void {
    const cronId = `${configurationId}_${botType}`;
    if (this._jobs[cronId]) {
      if (this._jobs[cronId].cron.running) {
        throw new Error(`Cron job with id ${cronId} is already running.`);
      }
      if (this._jobs[cronId].interval !== periodText) {
        this._jobs[cronId].cron.setTime(new CronTime(CronIntervals[periodText]));
      }
      this._jobs[cronId].cron.start();
      return;
    }
    this._jobs[cronId] = {
      name,
      cronId,
      cron: new CronJob(CronIntervals[periodText], fn, null, true),
      options,
      interval: periodText,
      botType,
    };
  }

  stop(cronId: string): void {
    const job = this._jobs[cronId];
    if (!job) {
      throw new Error(`Cron job with id ${cronId} does not exist.`);
    }
    job.cron.stop();
  }

  delete(cronId: string): void {
    const job = this._jobs[cronId];
    if (!job) {
      throw new Error(`Cron job with id ${cronId} does not exist.`);
    }
    job.cron.stop();
    delete this._jobs[cronId];
  }

  info(cronId: string): CronJobDetails {
    const job = this._jobs[cronId];
    if (!job) {
      throw new Error(`Cron job with id ${cronId} does not exist.`);
    }
    return job;
  }

  stopAll(): void {
    for (const jobName in this._jobs) {
      const job = this._jobs[jobName].cron;
      if (job.running) {
        job.stop();
      }
    }
  }

  list(): { [key: string]: CronJobDetails } {
    return this._jobs;
  }

  running(cronId: string): boolean {
    const job = this._jobs[cronId];
    if (!job) {
      return false;
    }
    return job.cron.running;
  }

  lastDate(cronId: string): Date | null {
    const job = this._jobs[cronId];
    if (!job) {
      throw new Error(`Cron job with id ${cronId} does not exist.`);
    }
    return job.cron.lastDate();
  }

  nextDate(cronId: string): any {
    const job = this._jobs[cronId];
    if (!job) {
      throw new Error(`Cron job with id ${cronId} does not exist.`);
    }
    return job.cron.nextDate();
  }
}

export { CronIntervals, TravianBotSettings };
