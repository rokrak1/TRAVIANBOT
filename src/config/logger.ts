import { supabase } from "./supabase";

export function createLogger(botId: string) {
  return async function (
    level: string,
    message: string,
    additionalInfo?: object
  ) {
    const { error } = await supabase.from("bot_logs").insert([
      {
        bot_id: botId,
        level,
        message,
        additional_info: additionalInfo || {},
      },
    ]);

    if (error) {
      console.error("Error logging to database:", error);
    }
  };
}
export async function serverLogger(
  level: string,
  message: string,
  additionalInfo?: object
) {
  if (process.env.DEV_MODE) {
    console.log(`${level}: ${message}`);
    return;
  }
  const { error } = await supabase.from("server_logs").insert([
    {
      level,
      message,
      additional_info: additionalInfo || {},
    },
  ]);

  if (error) {
    console.error("Error logging to database:", error);
  }
}

export enum LoggerLevels {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  SUCCESS = "success",
  GOLD_SPENT = "gold_spent",
  PROTECTION = "protection",
}
