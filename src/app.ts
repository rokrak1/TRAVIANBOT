import "dotenv/config";
import app from "./main";
import { getSupabaseActiveJobAndStartWorkersWithCron } from "./services/cron.service";

const start = async () => {
  try {
    const str = await app.listen({
      port: parseInt(process.env.PORT || "8000"),
      host: "0.0.0.0",
    });

    !process.env.DEV_MODE && (await getSupabaseActiveJobAndStartWorkersWithCron());

    console.log(`Server running at ${str}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
