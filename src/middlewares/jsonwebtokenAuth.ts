import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import jwt from "jsonwebtoken";

const jsonwebtokenAuth = (req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
  try {
    const token = req.headers.authorization;
    if (process.env.DEV_MODE) {
      done();
      return;
    }

    if (!token) {
      reply.code(401).send({ message: "Unauthorized" });
      done(new Error("Unauthorized, no token provided"));
      return;
    }
    const onlyToken = token.split(" ")[1];
    jwt.verify(onlyToken, process.env.JWT_SECRET || "");
    done();
  } catch (error) {
    reply.code(401);
    done(new Error("Unauthorized, invalid token provided"));
  }
};

export default jsonwebtokenAuth;
