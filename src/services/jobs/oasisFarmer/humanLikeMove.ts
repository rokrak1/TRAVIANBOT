import { Page } from "puppeteer";
import { delay } from "../../../utils";
import { getRandomInt } from "./oasisUtils";

// Function to simulate human-like dragging with variable speed
export async function humanLikeMouseMove(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  drag?: boolean
) {
  // Move the mouse to the start position
  await page.mouse.move(startX, startY);

  // Press down the mouse button
  if (drag) await page.mouse.down({ button: "left", clickCount: 15 });

  // Calculate the distance and the steps
  const distanceX = endX - startX;
  const distanceY = endY - startY;
  const steps = getRandomInt(5, 15); // Random steps for more variability

  for (let i = 0; i <= steps; i++) {
    // Calculate intermediate positions
    const intermediateX =
      startX + (distanceX / steps) * i + getRandomInt(-5, 5);
    const intermediateY =
      startY + (distanceY / steps) * i + getRandomInt(-5, 5);

    // Move the mouse to the intermediate position
    await page.mouse.move(intermediateX, intermediateY);

    // Random small delay to simulate human-like pauses
    // Introduce variable dragging speed
    const speed = Math.max(
      getRandomInt(0, 45),
      getRandomInt(65, 90) - steps * 3
    ); // Random speed delay
    await delay(speed, speed + 1);
  }

  // Release the mouse button
  if (drag) await page.mouse.up();
  await delay(600, 800);
}
