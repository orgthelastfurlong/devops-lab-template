type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, string | number | boolean | null | undefined>;

function emit(level: LogLevel, name: string, context: LogContext = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: "web",
    event: name,
    ...context,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }

  // Fire-and-forget structured event to API (also lands in VPS container logs).
  if (typeof fetch === "function") {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        level,
        context,
        ts: entry.ts,
      }),
      keepalive: true,
    }).catch(() => {
      // Never block UI on telemetry failures.
    });
  }
}

export const log = {
  debug: (name: string, context?: LogContext) => emit("debug", name, context),
  info: (name: string, context?: LogContext) => emit("info", name, context),
  warn: (name: string, context?: LogContext) => emit("warn", name, context),
  error: (name: string, context?: LogContext) => emit("error", name, context),
};
