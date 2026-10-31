"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/DocsContext";
import { ACCENTS, useHue, useMode } from "@/lib/theme";
import { DEFAULTS } from "@/lib/types";

export default function Settings() {
  const { thresholds, setThresholds, docs, setDocs, say, exportList } = useApp();
  const [mode, setMode] = useMode();
  const [hue, setHue] = useHue();
  const [hook, setHook] = useState("");
  useEffect(() => setHook(localStorage.getItem("fx-webhook") ?? ""), []);
  const [health, setHealth] = useState<{ key_set: boolean; model: string } | null | false>(null);

  useEffect(() => {
    fetch("/api/health").then((r) => (r.ok ? r.json() : Promise.reject())).then(setHealth).catch(() => setHealth(false));
  }, []);

  function clearAll() {
    if (!confirm(`Remove all ${docs.length} documents from this browser? Export first if you need them.`)) return;
    const before = docs;
    setDocs([]);
    say("All documents removed.", () => setDocs(before));
  }

  return (
    <main className="container narrow">
      <div className="page-head"><h1>Settings</h1></div>

      <section>
        <h2>Appearance</h2>
        <div className="seg" role="group" aria-label="Theme">
          {(["system", "light", "dark"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>{m[0].toUpperCase() + m.slice(1)}</button>
          ))}
        </div>
        <h3>Accent color</h3>
        <div className="swatches" role="group" aria-label="Accent color">
          {ACCENTS.map((a) => (
            <button key={a.name} type="button" className="swatch" aria-label={a.name} title={a.name} aria-pressed={hue === a.hue}
              style={{ background: `${a.hue < 0 ? "oklch(25% 0 0)" : `oklch(55% 0.14 ${a.hue})`}` }} onClick={() => setHue(a.hue)} />
          ))}
          <input type="range" min={0} max={360} value={hue} aria-label="Custom hue" onChange={(e) => setHue(+e.target.value)} />
        </div>
      </section>

      <section>
        <h2>Review thresholds</h2>
        <p className="note">Fields at or above the first value are accepted without a look. Below the second, you enter them by hand.</p>
        <label className="row">Accept without a look at {Math.round(thresholds.ok * 100)}% or more
          <input type="range" min={50} max={99} value={thresholds.ok * 100} onChange={(e) => setThresholds({ ...thresholds, ok: Math.max(+e.target.value / 100, thresholds.review) })} />
        </label>
        <label className="row">Enter by hand under {Math.round(thresholds.review * 100)}%
          <input type="range" min={10} max={95} value={thresholds.review * 100} onChange={(e) => setThresholds({ ...thresholds, review: Math.min(+e.target.value / 100, thresholds.ok) })} />
        </label>
        <label className="check">
          <input type="checkbox" checked={thresholds.strictAmounts} onChange={(e) => setThresholds({ ...thresholds, strictAmounts: e.target.checked })} />
          Be stricter on money, weight and piece counts
        </label>
        <p><button type="button" className="btn" onClick={() => setThresholds(DEFAULTS)}>Reset to defaults</button></p>
      </section>

      <section className="gap">
        <h2>Extraction service</h2>
        {health === null && <span className="skel" />}
        {health === false && <div className="state err"><strong>API not reachable.</strong>Start it with uvicorn on port 8010.</div>}
        {health && (
          <dl className="kv">
            <div><dt>API key</dt><dd>{health.key_set ? "set" : "missing: export OPENAI_API_KEY and restart the API"}</dd></div>
            <div><dt>Model</dt><dd>{health.model}</dd></div>
          </dl>
        )}
      </section>

      <section className="gap">
        <h2>Webhook</h2>
        <p className="note">Send documents as JSON to your own system (a TMS, Zapier, n8n). Select rows on the Documents page and choose Send to webhook.</p>
        <input className="v" type="url" placeholder="https://example.com/hook" aria-label="Webhook URL" value={hook} onChange={(e) => { setHook(e.target.value); localStorage.setItem("fx-webhook", e.target.value); }} />
      </section>

      <section className="gap">
        <h2>Your data</h2>
        <p className="note">Documents are stored only in this browser. Clearing site data deletes them.</p>
        <div className="bar-actions">
          <button type="button" className="btn" onClick={() => exportList("json", docs.filter((d) => d.status === "ready"))}>Back up as JSON</button>
          <button type="button" className="btn" onClick={clearAll} disabled={!docs.length}>Remove all documents</button>
        </div>
      </section>
    </main>
  );
}
