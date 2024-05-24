import { FastifyReply, FastifyRequest } from "fastify";
import { controller, get } from "../decorators";

@controller("/api")
class MainController {
  @get("/ping")
  async ping(req: FastifyRequest, reply: FastifyReply) {
    reply.send({
      status: "200 OK",
    });
  }
}

export default MainController;
