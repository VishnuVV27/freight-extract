"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/DocsContext";
import { plain } from "@/lib/export";
import { toCheck, type Doc } from "@/lib/types";
import { FieldsPanel } from "./FieldsPanel";
import { Queue, type Filter } from "./Queue";
import { SourceView } from "./SourceView";

export function Workbench() {
  const { docs, setDocs, patch, thresholds, ready, retry, canRetry, say, addSample, exportList, focusId } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(focusId);
  const [filter, setFilter] = useState<Filter>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [activeField, setActiveField] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const f = new URLSearchParams(window.location.hash.slice(1)).get("filter");
    if (f === "review" || f === "approved") setFilter(f);
  }, []);
  useEffect(() => {
    history.replaceState(null, "", filter === "all" ? window.location.pathname : `#filter=${filter}`);
  }, [filter]);
  useEffect(() => {
    if (focusId) setSelectedId(focusId);
  }, [focusId]);

  const types = useMemo(() => [...new Set(docs.filter((d) => d.type).map((d) => d.type))], [docs]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (filter === "approved" && !d.approved) return false;
      if (filter === "review" && (d.approved || (d.status === "ready" && toCheck(d, thresholds) === 0))) return false;
      if (typeFilter !== "all" && d.type !== typeFilter) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || Object.values(d.fields).some((f) => f.value.toLowerCase().includes(q));
    });
  }, [docs, filter, typeFilter, query, thresholds]);

  const selected = docs.find((d) => d.id === selectedId) ?? visible[0] ?? null;

  const ready_ = docs.filter((d) => d.status === "ready");
  const allFields = ready_.flatMap((d) => Object.values(d.fields));
  const autoPct = allFields.length ? Math.round((allFields.filter((f) => f.confidence >= thresholds.ok).length / allFields.length) * 100) : 0;
  const stats = {
    docs: docs.length,
    check: ready_.reduce((n, d) => n + toCheck(d, thresholds), 0),
    auto: `${autoPct}%`,
    approved: docs.filter((d) => d.approved).length,
  };
  const clean = ready_.filter((d) => !d.approved && toCheck(d, thresholds) === 0);

  function select(id: string) {
    setSelectedId(id);
    setActiveField(null);
  }

  function setField(id: string, key: string, value: string) {
    patch(id, (d) => ({ ...d, fields: { ...d.fields, [key]: { ...d.fields[key], value, confirmed: true } } }));
  }
  function confirmField(id: string, key: string) {
    patch(id, (d) => ({ ...d, fields: { ...d.fields, [key]: { ...d.fields[key], confirmed: true } } }));
  }
  function confirmAll(id: string) {
    patch(id, (d) => ({ ...d, fields: Object.fromEntries(Object.entries(d.fields).map(([k, f]) => [k, { ...f, confirmed: true }])) }));
  }
  function toggleApprove(d: Doc) {
    if (!d.approved && toCheck(d, thresholds) > 0 && !confirm(`${toCheck(d, thresholds)} field(s) are still unchecked. Approve anyway?`)) return;
    patch(d.id, (x) => ({ ...x, approved: !x.approved }));
  }
  function approveClean() {
    const ids = new Set(clean.map((d) => d.id));
    setDocs((all) => all.map((d) => (ids.has(d.id) ? { ...d, approved: true } : d)));
    say(`Approved ${ids.size} document${ids.size === 1 ? "" : "s"} with nothing left to check.`, () =>
      setDocs((all) => all.map((d) => (ids.has(d.id) ? { ...d, approved: false } : d))),
    );
  }
  function remove(d: Doc) {
    const index = docs.findIndex((x) => x.id === d.id);
    setDocs((all) => all.filter((x) => x.id !== d.id));
    setSelectedId(null);
    say(`Removed ${d.name}.`, () => setDocs((all) => [...all.slice(0, index), d, ...all.slice(index)]));
  }

  async function copy(d: Doc) {
    await navigator.clipboard.writeText(JSON.stringify(plain(d), null, 2));
    say("Copied this document as JSON.");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || el.closest("input, textarea, select, dialog")) return;
      const i = visible.findIndex((d) => d.id === selected?.id);
      if (e.key === "/") { e.preventDefault(); search.current?.focus(); }
      else if (e.key === "j" && visible[i + 1]) select(visible[i + 1].id);
      else if (e.key === "k" && visible[i - 1]) select(visible[i - 1].id);
      else if (e.key === "a" && selected?.status === "ready") toggleApprove(selected);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const empty = ready && docs.length === 0;

  return (
    <>
      <main className="container">
        <div className="page-head">
          <h1>Review</h1>
          <div className="bar-actions">
            <button type="button" className="btn" onClick={() => exportList("csv")}>Export CSV</button>
            <button type="button" className="btn" onClick={() => exportList("json")}>Export JSON</button>
          </div>
        </div>

        {empty ? (
          <section className="empty">
            <h2>Drop freight PDFs anywhere on this page</h2>
            <p className="lead">Rate confirmations, bills of lading and carrier invoices. You check only the fields the model was unsure about.</p>
            <div className="empty-actions">
              <button type="button" className="btn btn-primary" onClick={addSample}>Try a sample</button>
            </div>
            <p className="note">Scanned PDFs without a text layer are not supported yet.</p>
          </section>
        ) : (
          <>
            <section className="plate" aria-label="Totals">
              <dl className="stats">
                <div><dt>Documents</dt><dd>{stats.docs}</dd></div>
                <div><dt>Fields to check</dt><dd>{stats.check}</dd></div>
                <div><dt>Accepted without a look</dt><dd>{stats.auto}</dd></div>
                <div><dt>Approved</dt><dd>{stats.approved}</dd></div>
              </dl>
              {clean.length > 0 && (
                <button type="button" className="btn btn-primary" onClick={approveClean}>Approve {clean.length} clean</button>
              )}
            </section>

            <div className="work">
              <Queue
                docs={visible}
                total={docs.length}
                selectedId={selected?.id ?? null}
                filter={filter}
                onFilter={setFilter}
                typeFilter={typeFilter}
                onType={setTypeFilter}
                types={types}
                query={query}
                onQuery={setQuery}
                searchRef={search}
                thresholds={thresholds}
                onSelect={select}
              />
              <SourceView doc={selected} activeField={activeField} />
              <FieldsPanel
                doc={selected}
                thresholds={thresholds}
                canRetry={selected ? canRetry(selected.id) : false}
                onActive={setActiveField}
                onChange={(k, v) => selected && setField(selected.id, k, v)}
                onConfirm={(k) => selected && confirmField(selected.id, k)}
                onConfirmAll={() => selected && confirmAll(selected.id)}
                onApprove={() => selected && toggleApprove(selected)}
                onRemove={() => selected && remove(selected)}
                onCopy={() => selected && copy(selected)}
                onRetry={() => selected && retry(selected.id)}
              />
            </div>
            <p className="note keys">Keys: j and k move between documents, a approves, / searches.</p>
          </>
        )}
      </main>
    </>
  );
}
