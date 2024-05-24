import "reflect-metadata";
import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { Methods } from "./enums/Methods";
import { MetadataKeys } from "./enums/MetadataKeys";

interface RouteHandlerDescriptor<T extends RouteGenericInterface>
  extends PropertyDescriptor {
  value?: (req: FastifyRequest<T>, reply: FastifyReply) => void | Promise<void>;
}

function routerBinder(method: string) {
  return function <T extends RouteGenericInterface>(path: string) {
    return function (
      target: any,
      key: string,
      desc: RouteHandlerDescriptor<T>
    ) {
      Reflect.defineMetadata(MetadataKeys.PATH, path, target, key);
      Reflect.defineMetadata(MetadataKeys.METHOD, method, target, key);
      if (desc.value) {
        Reflect.defineMetadata(MetadataKeys.HANDLER, desc.value, target, key);
      }
    };
  };
}

export const get = routerBinder(Methods.GET);
export const post = routerBinder(Methods.POST);
export const put = routerBinder(Methods.PUT);
export const del = routerBinder(Methods.DEL);
export const patch = routerBinder(Methods.PATCH);
