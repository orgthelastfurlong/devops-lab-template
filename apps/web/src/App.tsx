import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { HealthStatus, Item } from "@lab/shared";
import { log } from "./log";
import "./App.css";

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    log.info("ui.refresh_start");
    const [readyRes, itemsRes] = await Promise.all([
      fetch("/api/health/ready"),
      fetch("/api/items"),
    ]);
    if (!readyRes.ok) {
      setError(`API readiness failed (${readyRes.status})`);
      log.warn("ui.ready_failed", { status: readyRes.status });
    }
    setHealth(await readyRes.json());
    if (itemsRes.ok) {
      const next = await itemsRes.json();
      setItems(next);
      log.info("ui.refresh_ok", { items: next.length });
    } else {
      log.warn("ui.items_failed", { status: itemsRes.status });
    }
  }

  useEffect(() => {
    let cancelled = false;
    log.info("ui.mount");
    void (async () => {
      try {
        const [readyRes, itemsRes] = await Promise.all([
          fetch("/api/health/ready"),
          fetch("/api/items"),
        ]);
        if (cancelled) return;
        if (!readyRes.ok) {
          setError(`API readiness failed (${readyRes.status})`);
          log.warn("ui.ready_failed", { status: readyRes.status });
        }
        setHealth(await readyRes.json());
        if (itemsRes.ok) {
          const next = await itemsRes.json();
          setItems(next);
          log.info("ui.bootstrap_ok", { items: next.length });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "load failed";
          setError(message);
          log.error("ui.bootstrap_error", { message });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    log.info("ui.item_submit");
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      setError(`Create failed (${response.status})`);
      log.warn("ui.item_create_failed", { status: response.status });
      return;
    }
    setTitle("");
    log.info("ui.item_create_ok");
    await refresh();
  }

  return (
    <main className="page">
      <p className="brand">thelastfurlong</p>
      <h1>DevOps lab</h1>
      <p className="lede">
        Percorso dimostrativo: PR, CI, release e deploy verificato su VPS.
      </p>

      <section>
        <h2>API</h2>
        {error ? <p className="error">{error}</p> : null}
        <pre>{health ? JSON.stringify(health, null, 2) : "loading…"}</pre>
      </section>

      <section>
        <h2>Items</h2>
        <form onSubmit={onSubmit}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nuovo item"
            required
          />
          <button type="submit">Aggiungi</button>
        </form>
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
