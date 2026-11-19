export type HealthStatus = {
  status: "ok" | "degraded";
  service: string;
  release?: string;
  database?: "up" | "down";
};

export type Item = {
  id: string;
  title: string;
  createdAt: string;
};

export type CreateItemInput = {
  title: string;
};
