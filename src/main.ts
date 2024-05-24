import { AppRouter } from "./router";

// Here we import the controllers to register the routes
import "./controllers/cron.controller";
import "./controllers/main.controller";
import "./controllers/proxy.controller";

const app = AppRouter.getInstance();

// CORS
app.register(require("@fastify/cors"), {
  origin: process.env.ORIGIN || "*",
});

// Routes can still be added as usual
app.get("/", async (req, res) => {
  return "api";
});

export default app;
