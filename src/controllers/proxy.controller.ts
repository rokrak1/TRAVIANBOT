import { FastifyReply, FastifyRequest } from "fastify";
import { controller, get, post } from "../decorators";
import {
  saveProxyConfiguration,
  testProxyConnection,
} from "../services/proxy.service";

@controller("/proxy")
class MainController {
  @post("/add")
  async add(req: FastifyRequest, reply: FastifyReply) {
    const { proxyName, proxyHost, proxyPort, proxyUsername, proxyPassword } =
      req.body as {
        proxyName: string;
        proxyHost: string;
        proxyPort: string;
        proxyUsername: string;
        proxyPassword: string;
      };

    // Test proxy configuration
    const isProxyWorking = await testProxyConnection(
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword
    );

    if (!isProxyWorking) {
      reply.code(500).send({
        status: "Proxy is not working",
      });
    }

    await saveProxyConfiguration({
      proxyName,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
    });

    reply.send({
      status: "200 OK",
    });
  }

  @post("/test")
  async test(req: FastifyRequest, reply: FastifyReply) {
    const { proxyHost, proxyPort, proxyUsername, proxyPassword } = req.body as {
      proxyHost: string;
      proxyPort: string;
      proxyUsername: string;
      proxyPassword: string;
    };

    // Test proxy configuration
    const isProxyWorking = await testProxyConnection(
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword
    );

    if (!isProxyWorking) {
      reply.code(500).send({
        status: "Proxy is not working",
      });
    }

    reply.send({
      status: "200 OK",
    });
  }
}

export default MainController;
