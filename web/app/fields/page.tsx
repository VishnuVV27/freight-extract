"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/DocsContext";
import { corrected, label } from "@/lib/types";

export default function Fields() {
  const { docs } = useApp();
  const [schema, setSchema] = useState<Record<string, string[]> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/schema").then((r) => (r.ok ? r.json() : Promise.reject())).then(setSchema).catch(() => setFailed(true));
  }, []);

  const ready = docs.filter((d) => d.status === "ready");

  return (
    <main className="container">
      <div className="page-head"><h1>Fields</h1></div>
      <p className="lead">What the model extracts for each document type, and how your own data has done so far.</p>
      {failed && <div className="state err"><strong>Could not load the field list.</strong>Is the API running on port 8010?</div>}
      {!schema && !failed && <span className="skel" />}
      {schema &&
        Object.entries(schema).map(([type, keys]) => {
          const t = type.replaceAll("_", " ");
          const mine = ready.filter((d) => d.type === t);
          return (
            <section key={type} className="gap">
              <h2>{t} <span className="note">({mine.length} extracted)</span></h2>
              <table>
                <thead><tr><th>Field</th><th className="num">Average confidence</th><th className="num">Corrected by you</th></tr></thead>
                <tbody>
                  {keys.map((k) => {
                    const fs = mine.map((d) => d.fields[k]).filter(Boolean);
                    const avg = fs.length ? (fs.reduce((n, f) => n + f.confidence, 0) / fs.length).toFixed(2) : "-";
                    return (
                      <tr key={k}>
                        <td>{label(k)}</td>
                        <td className="num">{avg}</td>
                        <td className="num">{fs.length ? `${fs.filter(corrected).length} of ${fs.length}` : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      <p className="note">Fields with many corrections are the ones to tighten in the prompt, or to always review.</p>
    </main>
  );
}
