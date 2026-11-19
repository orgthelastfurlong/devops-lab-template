import { randomUUID } from "node:crypto";
import type { FastifyServerOptions } from "fastify";

const release = process.env.RELEASE_SHA ?? "dev";

export function buildLoggerOptions(): FastifyServerOptions["logger"] {
  const level = process.env.LOG_LEVEL ?? "info";
  return {
    level,
    base: {
      service: "api",
      release,
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "DATABASE_URL",
        "body.password",
      ],
      remove: true,
    },
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          host: request.headers.host,
          remoteAddress: request.ip,
          userAgent: request.headers["user-agent"],
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
    },
  };
}

export function requestIdFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string {
  const raw = headers["x-request-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^[\w-]{8,128}$/.test(value)) {
    return value;
  }
  return randomUUID();
}
