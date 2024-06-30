import { Page } from "puppeteer";

export interface MouseSettings {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  gravity: number;
  wind: number;
  minWait: number;
  maxWait: number;
  maxStep: number;
  targetArea: number;
}

class WindMouse {
  private static instance: WindMouse;
  private settings: MouseSettings = {} as MouseSettings;

  constructor() {}

  public static getInstance(): WindMouse {
    if (!WindMouse.instance) {
      WindMouse.instance = new WindMouse();
    }
    return WindMouse.instance;
  }

  public init(settings: MouseSettings) {
    this.settings = settings;
  }

  public async mouseMove(page: Page, x: number, y: number, drag?: boolean, sleep?: number) {
    // Set destination
    this.newEndPosition({ x, y });

    // Press down the mouse button
    if (drag) await page.mouse.down({ button: "left", clickCount: 15 });

    // Move mouse
    const points = await this.GeneratePoints(this.settings);
    for (const [x, y, delay] of points) {
      await page.mouse.move(x, y, { steps: 1 });
    }

    // Set new start position
    this.newStartPosition({ x, y });

    // Release the mouse button
    if (drag) await page.mouse.up();

    let sleepTime = [sleep || 450, sleep ? sleep + 150 : 600];
    await this.Sleep(sleepTime[0], sleepTime[1]);
    return Promise.resolve();
  }

  public async mouseMoveAndClick(page: Page, x: number, y: number, sleep: number = 50) {
    await this.mouseMove(page, x, y, false, sleep);
    await page.mouse.click(x, y);
  }

  private newStartPosition({ x, y }: { x: number; y: number }) {
    this.settings = { ...this.settings, startX: x, startY: y };
  }

  private newEndPosition({ x, y }: { x: number; y: number }) {
    this.settings = { ...this.settings, endX: x, endY: y };
  }

  public setSettings(settings: MouseSettings) {
    this.settings = settings;
  }

  private async GeneratePoints(settings: MouseSettings): Promise<number[][]> {
    if (settings.gravity < 1) settings.gravity = 1;
    if (settings.maxStep === 0) settings.maxStep = 0.01;

    let dist: number;
    let windX: number = Math.floor(Math.random() * 10);
    let windY: number = Math.floor(Math.random() * 10);
    let velocityX: number = 0;
    let velocityY: number = 0;
    let randomDist: number;
    let veloMag: number;
    let step: number;

    let oldX: number;
    let oldY: number;
    let newX: number = Math.round(settings.startX);
    let newY: number = Math.round(settings.startY);

    const waitDiff: number = settings.maxWait - settings.minWait;
    const sqrt2: number = Math.sqrt(2.0);
    const sqrt3: number = Math.sqrt(3.0);
    const sqrt5: number = Math.sqrt(5.0);

    const points: number[][] = [];
    let currentWait: number = 0;

    dist = this.Hypot(settings.endX - settings.startX, settings.endY - settings.startY);

    while (dist > 1.0) {
      settings.wind = Math.min(settings.wind, dist);

      if (dist >= settings.targetArea) {
        const w: number = Math.floor(Math.random() * Math.round(settings.wind) * 2 + 1);

        windX = windX / sqrt3 + (w - settings.wind) / sqrt5;
        windY = windY / sqrt3 + (w - settings.wind) / sqrt5;
      } else {
        windX = windX / sqrt2;
        windY = windY / sqrt2;
        if (settings.maxStep < 3) settings.maxStep = Math.floor(Math.random() * 3) + 3.0;
        else settings.maxStep = settings.maxStep / sqrt5;
      }

      velocityX += windX;
      velocityY += windY;
      velocityX = velocityX + (settings.gravity * (settings.endX - settings.startX)) / dist;
      velocityY = velocityY + (settings.gravity * (settings.endY - settings.startY)) / dist;

      if (this.Hypot(velocityX, velocityY) > settings.maxStep) {
        randomDist = settings.maxStep / 2.0 + Math.floor((Math.random() * Math.round(settings.maxStep)) / 2);
        veloMag = this.Hypot(velocityX, velocityY);
        velocityX = (velocityX / veloMag) * randomDist;
        velocityY = (velocityY / veloMag) * randomDist;
      }

      oldX = Math.round(settings.startX);
      oldY = Math.round(settings.startY);
      settings.startX += velocityX;
      settings.startY += velocityY;
      dist = this.Hypot(settings.endX - settings.startX, settings.endY - settings.startY);
      newX = Math.round(settings.startX);
      newY = Math.round(settings.startY);

      step = this.Hypot(settings.startX - oldX, settings.startY - oldY);
      const wait = Math.round(waitDiff * (step / settings.maxStep) + settings.minWait);
      currentWait += wait;

      if (oldX !== newX || oldY !== newY) {
        points.push([newX, newY, currentWait]);
      }
    }

    const endX: number = Math.round(settings.endX);
    const endY: number = Math.round(settings.endY);

    if (endX !== newX || endY !== newY) {
      points.push([newX, newY, currentWait]);
    }

    return Promise.resolve(points);
  }

  Hypot(dx: number, dy: number) {
    return Math.sqrt(dx * dx + dy * dy);
  }

  Sleep(min: number, max: number) {
    const time = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise((r) => setTimeout(r, time));
  }
}

export default WindMouse;
