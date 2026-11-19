import Fastify from "fastify";
import type { CreateItemInput, HealthStatus, Item } from "@lab/shared";
import { prisma } from "./db.js";

const release = process.env.RELEASE_SHA ?? "dev";

export function buildApp() {
  const app = Fastify({ logger: true });

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
      request.log.error({ err: error }, "readiness check failed");
      return reply.code(503).send({
        status: "degraded",
        service: "api",
        release,
        database: "down",
      });
    }
  });

  app.get("/api/items", async (): Promise<Item[]> => {
    const rows = await prisma.item.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
    }));
  });

  app.post<{ Body: CreateItemInput }>("/api/items", async (request, reply) => {
    const title = request.body?.title?.trim();
    if (!title) {
      return reply.code(400).send({ error: "title is required" });
    }

    const row = await prisma.item.create({ data: { title } });
    const item: Item = {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
    };
    return reply.code(201).send(item);
  });

  return app;
}
