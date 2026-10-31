import type { Doc } from "./types";

function download(name: string, body: string, type: string) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([body], { type })), download: name });
  a.click();
  URL.revokeObjectURL(a.href);
}

export const plain = (d: Doc) => Object.fromEntries(Object.entries(d.fields).map(([k, f]) => [k, f.value]));

export function exportCsv(list: Doc[]) {
  const cols = [...new Set(list.flatMap((d) => Object.keys(d.fields)))];
  // Prefix a quote so spreadsheets never run a cell that starts like a formula
  const q = (s: string) => `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replaceAll('"', '""')}"`;
  const rows = [["document", "type", ...cols], ...list.map((d) => [d.name, d.type, ...cols.map((c) => d.fields[c]?.value ?? "")])];
  download("freight-extract.csv", rows.map((r) => r.map(q).join(",")).join("\n"), "text/csv");
}

export function exportJson(list: Doc[]) {
  download("freight-extract.json", JSON.stringify(list.map((d) => ({ document: d.name, type: d.type, approved: d.approved, fields: plain(d) })), null, 2), "application/json");
}
