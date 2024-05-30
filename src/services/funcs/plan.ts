import { supabase } from "../../config/supabase";
import { Slots } from "../builder/csvSlots";

export enum PlanStatus {
  UPGRADING = "UPGRADING",
  DONE = "DONE",
  WAITING = "WAITING",
}

export interface PlanItem {
  id: number;
  slot: Slots;
  level: number;
  status: PlanStatus;
}

export class PlanSingelton {
  private static instance: PlanSingelton;
  private botId: string;
  private plan: PlanItem[];

  private constructor(botId: string, plan: PlanItem[] = []) {
    this.plan = plan;
    this.botId = botId;
  }

  public static createInstance(botId: string, plan: PlanItem[]) {
    if (!PlanSingelton.instance) {
      PlanSingelton.instance = new PlanSingelton(botId, plan);
    }
    return PlanSingelton.instance;
  }

  public static getInstance(): PlanSingelton {
    return PlanSingelton.instance;
  }

  public getPlan() {
    return this.plan;
  }

  public async updateStatus(planId: number, status: PlanStatus) {
    try {
      const planItem = this.plan.find((item) => item.id === planId);
      if (planItem) {
        planItem.status = status;
      }
      const { data, error } = await supabase
        .from("bots")
        .update({ plan: this.plan })
        .eq("id", this.botId);
      if (error) {
        throw error;
      }
      return { error: null, status: "200" };
    } catch (err) {
      console.log(err);
      return { error: err, status: "500" };
    }
  }
}
