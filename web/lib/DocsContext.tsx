"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { exportCsv, exportJson, plain } from "./export";
import { type Doc } from "./types";
import { useDocs } from "./useDocs";

type Toast = { msg: string; undo?: () => void } | null;
type Ctx = ReturnType<typeof useDocs> & {
  toast: Toast;
  say: (msg: string, undo?: () => void) => void;
  dismiss: () => void;
  addSample: () => Promise<void>;
  focusId: string | null;
  setFocusId: (id: string | null) => void;
  sendWebhook: (list: Doc[]) => Promise<void>;
  exportList: (kind: "csv" | "json", list?: Doc[]) => void;
};

const DocsCtx = createContext<Ctx | null>(null);

export function DocsProvider({ children }: { children: React.ReactNode }) {
  const docs = useDocs();
  const router = useRouter();
  const [toast, setToast] = useState<Toast>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const say = useCallback((msg: string, undo?: () => void) => setToast({ msg, undo }), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (docs.storageFull) say("Browser storage is full. Export your results to keep them.");
  }, [docs.storageFull, say]);

  const { add } = docs;
  const addSample = useCallback(async () => {
    const r = await fetch("/api/sample").catch(() => null);
    if (!r?.ok) return say("The sample file could not be loaded. Is the API running?");
    const [id] = add([new File([await r.blob()], "sample_rate_confirmation.pdf", { type: "application/pdf" })]);
    setFocusId(id);
    router.push("/review");
  }, [add, say, router]);

  // Approved documents only when any exist, so a first export is never empty
  const exportList = useCallback(
    (kind: "csv" | "json", list?: Doc[]) => {
      const ready = docs.docs.filter((d) => d.status === "ready");
      const pick = list ?? (ready.some((d) => d.approved) ? ready.filter((d) => d.approved) : ready);
      if (!pick.length) return say("Nothing to export yet.");
      (kind === "csv" ? exportCsv : exportJson)(pick);
    },
    [docs.docs, say],
  );

  const sendWebhook = useCallback(
    async (list: Doc[]) => {
      const url = localStorage.getItem("fx-webhook") ?? "";
      if (!url) return say("Set a webhook URL in Settings first.");
      const payload = list.map((d) => ({ document: d.name, type: d.type, approved: d.approved, fields: plain(d) }));
      const r = await fetch("/api/webhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, payload }) }).catch(() => null);
      say(r?.ok ? `Sent ${list.length} document${list.length === 1 ? "" : "s"} to your webhook.` : "The webhook call failed. Check the URL in Settings.");
    },
    [say],
  );

  return (
    <DocsCtx.Provider value={{ ...docs, toast, focusId, setFocusId, say, dismiss: () => setToast(null), addSample, exportList, sendWebhook }}>{children}</DocsCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(DocsCtx);
  if (!c) throw new Error("useApp needs DocsProvider");
  return c;
}
