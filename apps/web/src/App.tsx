import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { HealthStatus, Item } from "@lab/shared";
import "./App.css";

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const [readyRes, itemsRes] = await Promise.all([
      fetch("/api/health/ready"),
      fetch("/api/items"),
    ]);
    if (!readyRes.ok) {
      setError(`API readiness failed (${readyRes.status})`);
    }
    setHealth(await readyRes.json());
    if (itemsRes.ok) {
      setItems(await itemsRes.json());
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [readyRes, itemsRes] = await Promise.all([
          fetch("/api/health/ready"),
          fetch("/api/items"),
        ]);
        if (cancelled) return;
        if (!readyRes.ok) {
          setError(`API readiness failed (${readyRes.status})`);
        }
        setHealth(await readyRes.json());
        if (itemsRes.ok) {
          setItems(await itemsRes.json());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "load failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      setError(`Create failed (${response.status})`);
      return;
    }
    setTitle("");
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
