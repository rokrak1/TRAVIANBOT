import path from "path";
import { sync } from "rimraf";
import { LoggerLevels, serverLogger } from "../../config/logger";

export const removeUserData = async (botId: string) => {
  const userDataPath = path.join(process.cwd(), "user_data", botId);
  try {
    await sync(userDataPath);
    console.log("Directory successfully removed");
    return { error: null, status: "200" };
  } catch (error) {
    console.error(`Failed to remove directory: ${error}`);
    await serverLogger(
      LoggerLevels.ERROR,
      `Failed to remove directory: ${error}`
    );
    return { error: error, status: "500" };
  }
};
