import { CronJob, CronTime } from "cron";

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

interface TravianAccountInfo {
  travianUsername: string;
  travianPassword: string;
  travianDomain: string;
  proxyDomain: string;
  proxyUsername: string;
  proxyPassword: string;
  type: string;
}

export interface CronJobDetails {
  name: string;
  cron: CronJob;
  botId: string;
  options: TravianAccountInfo;
  interval: keyof typeof CronIntervals;
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
    botId: string,
    periodText: keyof typeof CronIntervals,
    fn: () => void,
    options: TravianAccountInfo
  ): void {
    if (this._jobs[botId]) {
      if (this._jobs[botId].cron.running) {
        throw new Error(`Cron job with id ${botId} is already running.`);
      }
      if (this._jobs[botId].interval !== periodText) {
        this._jobs[botId].cron.setTime(new CronTime(CronIntervals[periodText]));
      }
      this._jobs[botId].cron.start();
      return;
    }
    this._jobs[botId] = {
      name,
      botId,
      cron: new CronJob(CronIntervals[periodText], fn, null, true),
      options,
      interval: periodText,
    };
  }

  stop(botId: string): void {
    const job = this._jobs[botId];
    if (!job) {
      throw new Error(`Cron job with id ${botId} does not exist.`);
    }
    job.cron.stop();
  }

  delete(botId: string): void {
    const job = this._jobs[botId];
    if (!job) {
      throw new Error(`Cron job with id ${botId} does not exist.`);
    }
    job.cron.stop();
    delete this._jobs[botId];
  }

  info(botId: string): CronJobDetails {
    const job = this._jobs[botId];
    if (!job) {
      throw new Error(`Cron job with id ${botId} does not exist.`);
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

  running(botId: string): boolean {
    const job = this._jobs[botId];
    if (!job) {
      return false;
    }
    return job.cron.running;
  }

  lastDate(botId: string): Date | null {
    const job = this._jobs[botId];
    if (!job) {
      throw new Error(`Cron job with id ${botId} does not exist.`);
    }
    return job.cron.lastDate();
  }

  nextDate(botId: string): any {
    const job = this._jobs[botId];
    if (!job) {
      throw new Error(`Cron job with id ${botId} does not exist.`);
    }
    return job.cron.nextDate();
  }
}

export { CronIntervals, TravianAccountInfo };
