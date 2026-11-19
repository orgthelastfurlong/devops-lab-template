import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { buildApp } from "./app.js";
import { prisma } from "./db.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);

before(async () => {
  if (!hasDatabase) return;
  await prisma.item.deleteMany();
});

after(async () => {
  await prisma.$disconnect();
});

test("live health does not require database", async () => {
  const app = buildApp();
  const response = await app.inject({ method: "GET", url: "/api/health/live" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, "ok");
  await app.close();
});

test(
  "items CRUD against postgres",
  { skip: !hasDatabase },
  async () => {
    const app = buildApp();

    const create = await app.inject({
      method: "POST",
      url: "/api/items",
      payload: { title: "lab item" },
    });
    assert.equal(create.statusCode, 201);
    assert.equal(create.json().title, "lab item");

    const list = await app.inject({ method: "GET", url: "/api/items" });
    assert.equal(list.statusCode, 200);
    assert.equal(list.json().length, 1);

    const ready = await app.inject({ method: "GET", url: "/api/health/ready" });
    assert.equal(ready.statusCode, 200);
    assert.equal(ready.json().database, "up");

    await app.close();
  },
);
