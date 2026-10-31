"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/DocsContext";
import { toCheck } from "@/lib/types";

type Sort = "name" | "type" | "check";

export default function Documents() {
  const { docs, setDocs, thresholds, setFocusId, say, exportList, sendWebhook } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("name");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const list = docs.filter((d) => !n || d.name.toLowerCase().includes(n) || d.type.includes(n) || Object.values(d.fields).some((f) => f.value.toLowerCase().includes(n)));
    return list.sort((a, b) => (sort === "check" ? toCheck(b, thresholds) - toCheck(a, thresholds) : a[sort].localeCompare(b[sort])));
  }, [docs, q, sort, thresholds]);

  const chosen = docs.filter((d) => picked.has(d.id));
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (!n.delete(id)) n.add(id); return n; });
  const allOn = rows.length > 0 && rows.every((d) => picked.has(d.id));

  function approve() {
    const ids = new Set(chosen.filter((d) => d.status === "ready").map((d) => d.id));
    setDocs((all) => all.map((d) => (ids.has(d.id) ? { ...d, approved: true } : d)));
    say(`Approved ${ids.size} document${ids.size === 1 ? "" : "s"}.`, () => setDocs((all) => all.map((d) => (ids.has(d.id) ? { ...d, approved: false } : d))));
    setPicked(new Set());
  }
  function remove() {
    const gone = chosen;
    const ids = new Set(gone.map((d) => d.id));
    const before = docs;
    setDocs((all) => all.filter((d) => !ids.has(d.id)));
    say(`Removed ${gone.length} document${gone.length === 1 ? "" : "s"}.`, () => setDocs(before));
    setPicked(new Set());
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1>Documents</h1>
        <div className="bar-actions">
          <button type="button" className="btn" disabled={!chosen.length} onClick={approve}>Approve selected</button>
          <button type="button" className="btn" disabled={!chosen.length} onClick={() => exportList("csv", chosen.filter((d) => d.status === "ready"))}>Export selected</button>
          <button type="button" className="btn" disabled={!chosen.length} onClick={() => sendWebhook(chosen.filter((d) => d.status === "ready"))}>Send to webhook</button>
          <button type="button" className="btn" disabled={!chosen.length} onClick={remove}>Remove selected</button>
        </div>
      </div>
      <div className="tools tools-wide">
        <input className="v" type="search" placeholder="Search names and extracted values" aria-label="Search documents" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="seg" role="group" aria-label="Sort by">
          {(["name", "type", "check"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}>{s === "check" ? "To check" : s[0].toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="note">No documents match. Add PDFs from the top bar.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" aria-label="Select all" checked={allOn} onChange={() => setPicked(allOn ? new Set() : new Set(rows.map((d) => d.id)))} /></th>
              <th>Document</th><th>Type</th><th>Status</th><th className="num">Fields</th><th className="num">To check</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td><input type="checkbox" aria-label={`Select ${d.name}`} checked={picked.has(d.id)} onChange={() => toggle(d.id)} /></td>
                <td><button type="button" className="link" onClick={() => { setFocusId(d.id); router.push("/review"); }}>{d.name}</button></td>
                <td>{d.type}</td>
                <td><span className={d.approved ? "chip chip-ok" : d.status === "error" ? "chip chip-stop" : "chip"}>{d.status === "ready" ? (d.approved ? "approved" : "ready") : d.status}</span></td>
                <td className="num">{Object.keys(d.fields).length}</td>
                <td className="num">{toCheck(d, thresholds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
