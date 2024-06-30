import { supabase } from "../../config/supabase";
import { PlanItem, PlanStatus, VillageConfiguration } from "../../types/main.types";

export class PlanSingelton {
  private static instance: PlanSingelton;
  private configurationId: string;
  private plan: PlanItem[];
  private planIndex: number = 0;
  private village_configuration: VillageConfiguration;

  private constructor(configurationId: string, village_configuration: VillageConfiguration, planIndex: number = 0) {
    this.village_configuration = village_configuration;
    this.plan = village_configuration.config[planIndex].plan;
    this.configurationId = configurationId;
    this.planIndex = 0;
  }

  public static createInstance(
    configurationId: string,
    village_configuration: VillageConfiguration,
    planIndex: number = 0
  ) {
    PlanSingelton.instance = new PlanSingelton(configurationId, village_configuration, planIndex);
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
      console.log("Updating status", planId, status);
      const planItem = this.plan.find((item) => item.id === planId);
      if (planItem) {
        planItem.status = status;
      }

      const newConfig = this.village_configuration.config.map((conf, i) => {
        if (i === this.planIndex) {
          conf.plan = this.plan;
        }
        return conf;
      });
      console.log(newConfig);
      this.village_configuration.config = newConfig;

      const { data, error } = await supabase
        .from("bot_configuration")
        .update({ village_configuration: this.village_configuration })
        .eq("id", this.configurationId);
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
