"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useApp } from "@/lib/DocsContext";
import { useMode, type Mode } from "@/lib/theme";
import { Palette } from "./Palette";

const ICONS: Record<string, string> = {
  "/": "M3 12 12 4l9 8M5 10v10h14V10",
  "/review": "M4 5h16v14H4zM12 5v14M4 10h8",
  "/documents": "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  "/fields": "M4 6h16M4 12h16M4 18h10",
  "/settings": "M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6",
  "/help": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01",
};
const NAV: [string, string][] = [["/", "Dashboard"], ["/review", "Review"], ["/documents", "Documents"], ["/fields", "Fields"], ["/settings", "Settings"], ["/help", "Help"]];
const NEXT: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };

function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { add, setFocusId, toast, dismiss } = useApp();
  const path = usePathname();
  const router = useRouter();
  const [mode, setMode] = useMode();
  const fileInput = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);

  function addFiles(list: FileList | File[]) {
    const ids = add([...list]);
    if (!ids[0]) return;
    setFocusId(ids[0]);
    router.push("/review");
  }

  return (
    <div
      className={dragging ? "app dragging" : "app"}
      onDragEnter={(e) => { e.preventDefault(); depth.current++; setDragging(true); }}
      onDragLeave={() => { if (--depth.current <= 0) { depth.current = 0; setDragging(false); } }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); depth.current = 0; setDragging(false); addFiles(e.dataTransfer.files); }}
    >
      <aside className="side">
        <Link href="/" className="brand"><span className="brand-mark"><Icon d="M6 4h9l3 3v13H6zM9 12h6M9 16h6" /></span>Freight Extract</Link>
        <input ref={fileInput} type="file" accept="application/pdf,.pdf" multiple hidden onChange={(e) => { addFiles(e.target.files ?? []); e.target.value = ""; }} />
        <button type="button" className="btn btn-primary" onClick={() => fileInput.current?.click()}>Add PDFs</button>
        <nav aria-label="Main" className="nav">
          {NAV.map(([href, text]) => (
            <Link key={href} href={href} aria-current={path === href ? "page" : undefined}><Icon d={ICONS[href]} />{text}</Link>
          ))}
        </nav>
        <div className="side-foot">
          <button type="button" className="btn" onClick={() => window.dispatchEvent(new Event("open-palette"))}>
            Search<span className="kbd">⌘K</span>
          </button>
          <button type="button" className="btn" onClick={() => setMode(NEXT[mode])} aria-label={`Theme: ${mode}. Switch to ${NEXT[mode]}`}>
            Theme: {mode}
          </button>
        </div>
      </aside>

      <div className="content">{children}</div>
      <Palette />

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span>{toast.msg}</span>
          {toast.undo && <button type="button" onClick={() => { toast.undo?.(); dismiss(); }}>Undo</button>}
        </div>
      )}
    </div>
  );
}
