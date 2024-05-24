import { parentPort } from "worker_threads";
import { travianStart } from "../services/travian.service";

if (parentPort) {
  parentPort.on("message", async (data: any) => {
    const { botId, options } = data;
    try {
      const result = await travianStart(botId, options);
      parentPort!.postMessage({ success: true, result });
    } catch (error) {
      parentPort!.postMessage({ success: false, error: error });
    }
  });
} else {
  console.error("This script should be run as a worker thread");
}
