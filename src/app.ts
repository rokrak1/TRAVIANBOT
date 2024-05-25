import "dotenv/config";
import app from "./main";
import { getSupabaseActiveJobAndStartWorkersWithCron } from "./controllers/cron.controller";

const start = async () => {
  try {
    const str = await app.listen({
      port: parseInt(process.env.PORT || "8000"),
      host: "0.0.0.0",
    });
    await getSupabaseActiveJobAndStartWorkersWithCron();

    console.log(`Server running at ${str}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
