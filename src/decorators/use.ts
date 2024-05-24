import "reflect-metadata";
import { MetadataKeys } from "./enums/MetadataKeys";
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";

type FastifyMiddleware = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) => void;

/**
 *  Middleware decorator
 *
 *  This decorator is used to define a middleware for a route
 *
 *  It will be used to inject a middleware into the route
 *
 *  Middleware as a preHandler hook
 *
 */
export function use(hook: FastifyMiddleware) {
  return function (target: any, key: string, desc: PropertyDescriptor) {
    const hooks =
      Reflect.getMetadata(MetadataKeys.MIDDLEWARE, target, key) || [];
    Reflect.defineMetadata(
      MetadataKeys.MIDDLEWARE,
      [...hooks, hook],
      target,
      key
    );
  };
}
