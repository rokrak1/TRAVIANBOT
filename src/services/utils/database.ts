import { LoggerLevels, serverLogger } from "../../config/logger";
import { supabase } from "../../config/supabase";
import { PlanSingelton } from "../funcs/plan";

export enum BotType {
  VILLAGE_BUILDER = "VILLAGE_BUILDER",
  FARMER = "FARMER",
  OASIS_FARMER = "OASIS_FARMER",
}

export const fetchBotPlan = async (botId: string) => {
  const { data: bot, error: bError } = await supabase
    .from("bots")
    .select("plan, type")
    .eq("id", botId)
    .single();
  if (bError) {
    throw bError;
  }

  if (!bot) {
    await serverLogger(LoggerLevels.ERROR, "Bot configuration not found");
    throw new Error("Bot configuration not found");
  }
  const { plan, type } = bot;

  if (type === BotType.VILLAGE_BUILDER && !plan) {
    await serverLogger(LoggerLevels.ERROR, "Bot plan not found");
    throw new Error("Bot plan not found");
  }

  if (plan && plan?.length && type === BotType.VILLAGE_BUILDER) {
    PlanSingelton.createInstance(botId, plan);
  }

  return type;
};

export const travianStop = async (botId: string) => {
  try {
    const { data: bot, error: bError } = await supabase
      .from("bots")
      .select()
      .eq("id", botId)
      .single();
    if (bError) {
      throw bError;
    }

    const { data, error } = await supabase
      .from("bot_configuration")
      .delete()
      .eq("id", bot.configuration_id);
    if (error) {
      throw error;
    }
    return { error: null, status: "200" };
  } catch (err) {
    console.log(err);
    return { error: err, status: "500" };
  }
};
