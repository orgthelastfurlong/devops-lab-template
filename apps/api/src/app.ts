import Fastify from "fastify";
import type { ClientEvent, CreateItemInput, HealthStatus, Item } from "@lab/shared";
import { prisma } from "./db.js";
import { buildLoggerOptions, requestIdFromHeaders } from "./logger.js";

const release = process.env.RELEASE_SHA ?? "dev";

export function buildApp() {
  const app = Fastify({
    logger: buildLoggerOptions(),
    requestIdHeader: "x-request-id",
    genReqId: (request) => requestIdFromHeaders(request.headers),
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  app.get("/api/health/live", async (): Promise<HealthStatus> => ({
    status: "ok",
    service: "api",
    release,
  }));

  app.get("/api/health/ready", async (request, reply): Promise<HealthStatus> => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        service: "api",
        release,
        database: "up",
      };
    } catch (error) {
      request.log.error({ err: error, event: "health.ready_failed" }, "readiness check failed");
      return reply.code(503).send({
        status: "degraded",
        service: "api",
        release,
        database: "down",
      });
    }
  });

  app.get("/api/items", async (request): Promise<Item[]> => {
    const rows = await prisma.item.findMany({ orderBy: { createdAt: "desc" } });
    request.log.info({ event: "items.list", count: rows.length }, "listed items");
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
    }));
  });

  app.post<{ Body: CreateItemInput }>("/api/items", async (request, reply) => {
    const title = request.body?.title?.trim();
    if (!title) {
      request.log.warn({ event: "items.create_rejected" }, "title missing");
      return reply.code(400).send({ error: "title is required" });
    }

    const row = await prisma.item.create({ data: { title } });
    const item: Item = {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
    };
    request.log.info({ event: "items.created", itemId: item.id }, "item created");
    return reply.code(201).send(item);
  });

  app.post<{ Body: ClientEvent }>("/api/events", async (request, reply) => {
    const body = request.body;
    if (!body?.name || typeof body.name !== "string") {
      return reply.code(400).send({ error: "name is required" });
    }
    if (body.name.length > 128) {
      return reply.code(400).send({ error: "name too long" });
    }

    request.log.info(
      {
        event: "client.event",
        clientEvent: body.name,
        clientLevel: body.level ?? "info",
        clientContext: body.context ?? {},
        clientTs: body.ts,
      },
      "client event",
    );
    return reply.code(202).send({ accepted: true });
  });

  return app;
}
