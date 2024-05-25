import { FastifyReply, FastifyRequest } from "fastify";
import { controller, get } from "../decorators";
import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

@controller("/api")
class MainController {
  @get("/ping")
  async ping(req: FastifyRequest, reply: FastifyReply) {
    reply.send({
      status: "200 OK",
    });
  }
  @get("/docker-stats")
  async dockerStats(req: FastifyRequest, reply: FastifyReply) {
    const containerName = process.env.CONTAINER_NAME; // The name is passed as an environment variable

    try {
      // List all containers and filter by name
      const containerInfo = (await docker.listContainers()).find((c) =>
        c.Names.some((n) => n === "/" + containerName)
      );
      if (!containerInfo) {
        return reply.status(404).send({ error: "Container not found" });
      }

      // Get stats for the found container
      const container = docker.getContainer(containerInfo.Id);

      // Fetch stats
      const stats = await container.stats({ stream: false });

      reply.send(stats);
    } catch (error) {
      console.error("Failed to fetch Docker stats:", error);
      reply.status(500).send({ error: error });
    }
  }
}

export default MainController;
