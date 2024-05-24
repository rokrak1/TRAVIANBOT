import Fastify, { FastifyInstance } from "fastify";

export class AppRouter {
  private static instance: FastifyInstance;

  static getInstance(): FastifyInstance {
    if (!AppRouter.instance) {
      AppRouter.instance = Fastify({
        logger: true,
      });
    }
    return AppRouter.instance;
  }
}
