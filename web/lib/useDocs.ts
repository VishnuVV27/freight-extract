"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULTS, type Doc, type Field, type Thresholds } from "./types";

const DOCS_KEY = "freight-extract-docs-v2";
const SET_KEY = "freight-extract-settings-v2";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const toField = (f: { value?: string; confidence?: number } | undefined): Field => ({
  value: String(f?.value ?? ""),
  original: String(f?.value ?? ""),
  confidence: Number(f?.confidence) || 0,
  confirmed: false,
});

// shortcut: results live in localStorage only (no accounts, no server storage); move to a database when more than one person uses it
export function useDocs() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [storageFull, setStorageFull] = useState(false);
  const files = useRef(new Map<string, File>());

  useEffect(() => {
    setDocs(read<Doc[]>(DOCS_KEY, []));
    setThresholds({ ...DEFAULTS, ...read<Partial<Thresholds>>(SET_KEY, {}) });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DOCS_KEY, JSON.stringify(docs.filter((d) => d.status === "ready")));
      localStorage.setItem(SET_KEY, JSON.stringify(thresholds));
      setStorageFull(false);
    } catch {
      setStorageFull(true);
    }
  }, [docs, thresholds, ready]);

  const patch = useCallback((id: string, fn: (d: Doc) => Doc) => setDocs((all) => all.map((d) => (d.id === id ? fn(d) : d))), []);

  const run = useCallback(
    async (id: string, file: File) => {
      patch(id, (d) => ({ ...d, status: "loading", error: undefined }));
      try {
        if (!/\.pdf$/i.test(file.name)) throw new Error("Only PDF files are supported.");
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/extract", { method: "POST", body: fd });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || `Server error ${r.status}`);
        const j = await r.json();
        patch(id, (d) => ({
          ...d,
          status: "ready",
          type: String(j.doc_type || "unknown").replaceAll("_", " "),
          text: j.text || "",
          fields: Object.fromEntries(Object.entries(j.fields || {}).map(([k, f]) => [k, toField(f as Field)])),
        }));
      } catch (e) {
        patch(id, (d) => ({ ...d, status: "error", error: e instanceof Error ? e.message : "Unknown error" }));
      }
    },
    [patch],
  );

  const add = useCallback(
    (list: File[]) => {
      const created = list.map((file) => {
        const id = crypto.randomUUID();
        files.current.set(id, file);
        return { id, file, doc: { id, name: file.name, status: "loading", type: "", text: "", fields: {}, approved: false } as Doc };
      });
      setDocs((all) => [...created.map((c) => c.doc), ...all]);
      created.forEach((c) => run(c.id, c.file));
      return created.map((c) => c.id);
    },
    [run],
  );

  const retry = useCallback(
    (id: string) => {
      const f = files.current.get(id);
      if (f) run(id, f);
    },
    [run],
  );

  const canRetry = useCallback((id: string) => files.current.has(id), []);

  return { docs, setDocs, patch, thresholds, setThresholds, ready, storageFull, add, retry, canRetry };
}
