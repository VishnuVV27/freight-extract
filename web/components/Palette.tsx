"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/DocsContext";

const PAGES: [string, string][] = [["/", "Dashboard"], ["/review", "Review"], ["/documents", "Documents"], ["/fields", "Fields"], ["/settings", "Settings"], ["/help", "Help"]];

export function Palette() {
  const { docs, setFocusId } = useApp();
  const router = useRouter();
  const dlg = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);

  useEffect(() => {
    function open() {
      setQ("");
      setI(0);
      if (!dlg.current?.open) dlg.current?.showModal();
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", open);
    };
  }, []);

  const n = q.trim().toLowerCase();
  const items = [
    ...PAGES.filter(([, t]) => t.toLowerCase().includes(n)).map(([href, t]) => ({ key: href, text: t, hint: "page", go: () => router.push(href) })),
    ...docs.filter((d) => d.name.toLowerCase().includes(n) || (n && Object.values(d.fields).some((f) => f.value.toLowerCase().includes(n)))).slice(0, 8)
      .map((d) => ({ key: d.id, text: d.name, hint: "document", go: () => { setFocusId(d.id); router.push("/review"); } })),
  ];
  const run = (k: number) => { items[k]?.go(); dlg.current?.close(); };

  return (
    <dialog ref={dlg} className="palette" aria-label="Command palette" onClick={(e) => e.target === dlg.current && dlg.current.close()}>
      <input
        autoFocus
        placeholder="Jump to a page, document or extracted value"
        aria-label="Search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setI(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setI(Math.min(i + 1, items.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setI(Math.max(i - 1, 0)); }
          else if (e.key === "Enter") run(i);
        }}
      />
      <ul>
        {items.map((it, k) => (
          <li key={it.key}><button type="button" aria-selected={k === i} onClick={() => run(k)}><span>{it.text}</span><small>{it.hint}</small></button></li>
        ))}
        {items.length === 0 && <li className="note" style={{ padding: "var(--space-sm)" }}>Nothing matches.</li>}
      </ul>
    </dialog>
  );
}
