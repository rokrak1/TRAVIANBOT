import "reflect-metadata";
import { MetadataKeys } from "./enums/MetadataKeys";
import { FastifySchema } from "fastify";

/**
 *  Schema decorator
 *
 *  This decorator is used to define a schema for a route
 *
 *  It will be used to validate the request payload
 *
 */
export function schema(schema: FastifySchema) {
  return function (target: any, key: string, desc: PropertyDescriptor) {
    Reflect.defineMetadata(MetadataKeys.SCHEMA, schema, target, key);
  };
}
