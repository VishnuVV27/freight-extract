import { corrected, toCheck, type Doc, type Thresholds } from "./types";

export function summarize(docs: Doc[], t: Thresholds) {
  const ready = docs.filter((d) => d.status === "ready");
  const fields = ready.flatMap((d) => Object.entries(d.fields).map(([k, f]) => ({ k, f, type: d.type })));
  const auto = fields.filter(({ f }) => f.confidence >= t.ok).length;
  const fixed = fields.filter(({ f }) => corrected(f)).length;
  const buckets = [0, 0, 0, 0, 0]; // <0.5, 0.5-0.7, 0.7-0.85, 0.85-0.95, 0.95+
  for (const { f } of fields) buckets[f.confidence < 0.5 ? 0 : f.confidence < 0.7 ? 1 : f.confidence < 0.85 ? 2 : f.confidence < 0.95 ? 3 : 4]++;
  const byType: Record<string, number> = {};
  for (const d of ready) byType[d.type] = (byType[d.type] ?? 0) + 1;
  return {
    total: docs.length,
    ready,
    fields,
    check: ready.reduce((n, d) => n + toCheck(d, t), 0),
    autoPct: fields.length ? Math.round((auto / fields.length) * 100) : 0,
    approved: docs.filter((d) => d.approved).length,
    fixed,
    fixedPct: fields.length ? Math.round((fixed / fields.length) * 100) : 0,
    buckets,
    byType,
  };
}

export const BUCKET_LABELS = ["under 50%", "50 to 70%", "70 to 85%", "85 to 95%", "95%+"];
