export type Field = { value: string; confidence: number; confirmed: boolean; original?: string };

export type Doc = {
  id: string;
  name: string;
  status: "loading" | "ready" | "error";
  type: string;
  text: string;
  fields: Record<string, Field>;
  approved: boolean;
  error?: string;
};

export type Thresholds = { ok: number; review: number; strictAmounts: boolean };
export type Tier = "ok" | "review" | "stop";

export const DEFAULTS: Thresholds = { ok: 0.92, review: 0.7, strictAmounts: true };

const AMOUNT = /rate|amount|total|weight|pieces/;

// Routing signal only, never a correctness gate
export function tierOf(key: string, confidence: number, t: Thresholds): Tier {
  const bump = t.strictAmounts && AMOUNT.test(key) ? 0.04 : 0;
  if (confidence >= Math.min(t.ok + bump, 0.99)) return "ok";
  return confidence >= t.review ? "review" : "stop";
}

// Format sanity checks catch confident-but-wrong values the score alone would pass
export function invalid(key: string, value: string) {
  const v = value.trim();
  if (!v) return false;
  if (/rate|amount/.test(key)) return !/^[$€£]?\s*\d[\d,]*(\.\d+)?$/.test(v);
  if (/date/.test(key)) return Number.isNaN(Date.parse(v));
  if (key === "currency") return !/^[A-Za-z]{3}$/.test(v);
  return false;
}

export const needsCheck = (key: string, f: Field, t: Thresholds) =>
  !f.confirmed && (tierOf(key, f.confidence, t) !== "ok" || invalid(key, f.value));

export const toCheck = (d: Doc, t: Thresholds) =>
  d.status === "ready" ? Object.entries(d.fields).filter(([k, f]) => needsCheck(k, f, t)).length : 0;

export const label = (key: string) => key.replaceAll("_", " ");

export const corrected = (f: Field) => f.original !== undefined && f.value !== f.original;
