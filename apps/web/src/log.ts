type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, string | number | boolean | null | undefined>;

const isProd = import.meta.env.PROD;

function emit(level: LogLevel, name: string, context: LogContext = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: "web",
    event: name,
    ...context,
  };

  // Browser console only in local/dev; prod sends telemetry to the API only.
  if (!isProd) {
    const line = JSON.stringify(entry);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.info(line);
    }
  } else if (level === "error") {
    console.error(JSON.stringify(entry));
  }

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
