"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BUCKET_LABELS, summarize } from "@/lib/stats";
import { useApp } from "@/lib/DocsContext";
import { corrected, label, toCheck } from "@/lib/types";

function Bars({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <ul className="bars">
      {labels.map((l, i) => (
        <li key={l}>
          <span>{l}</span>
          <span className="bar-track"><span className="bar-fill" style={{ width: `${(values[i] / max) * 100}%` }} /></span>
          <span className="num">{values[i]}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { docs, thresholds, ready, addSample, setFocusId } = useApp();
  const router = useRouter();
  const s = summarize(docs, thresholds);
  const attention = s.ready.filter((d) => !d.approved && toCheck(d, thresholds) > 0).slice(0, 5);
  const recent = docs.slice(0, 5);
  const types = Object.keys(s.byType);
  const fixedBy: Record<string, number> = {};
  for (const { k, f } of s.fields) if (corrected(f)) fixedBy[k] = (fixedBy[k] ?? 0) + 1;
  const topFixed = Object.entries(fixedBy).sort((a, b) => b[1] - a[1]).slice(0, 5);

  function open(id: string) {
    setFocusId(id);
    router.push("/review");
  }

  if (ready && docs.length === 0) {
    return (
      <main className="container">
        <section className="empty">
          <h1>Read freight PDFs. Check only what the model doubts.</h1>
          <p className="lead">Drop rate confirmations, bills of lading and carrier invoices anywhere on the page, or press Add PDFs. You review the uncertain fields and export clean CSV or JSON.</p>
          <div className="empty-actions">
            <button type="button" className="btn btn-primary" onClick={addSample}>Try a sample</button>
            <Link href="/help" className="btn">How it works</Link>
          </div>
          <p className="note">Scanned PDFs without a text layer are not supported yet.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head"><h1>Dashboard</h1></div>
      <section className="plate" aria-label="Totals">
        <dl className="stats stats-6">
          <div><dt>Documents</dt><dd>{s.total}</dd></div>
          <div><dt>Approved</dt><dd>{s.approved}</dd></div>
          <div><dt>Fields to check</dt><dd>{s.check}</dd></div>
          <div><dt>Accepted without a look</dt><dd>{s.autoPct}%</dd></div>
          <div><dt>Fields corrected</dt><dd>{s.fixed}</dd></div>
          <div><dt>Correction rate</dt><dd>{s.fixedPct}%</dd></div>
        </dl>
      </section>

      <div className="grid-2">
        <section>
          <h2>Needs attention</h2>
          {attention.length === 0 ? (
            <p className="note">Nothing waiting. Every ready document is approved or clean.</p>
          ) : (
            <table>
              <tbody>
                {attention.map((d) => (
                  <tr key={d.id}>
                    <td><button type="button" className="link" onClick={() => open(d.id)}>{d.name}</button></td>
                    <td className="num">{toCheck(d, thresholds)} to check</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h2 className="gap">Recent documents</h2>
          <table>
            <tbody>
              {recent.map((d) => (
                <tr key={d.id}>
                  <td><button type="button" className="link" onClick={() => open(d.id)}>{d.name}</button></td>
                  <td>{d.status === "ready" ? d.type : d.status}</td>
                  <td className="num">{d.approved ? "approved" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note"><Link href="/documents">All documents</Link></p>
        </section>

        <section>
          <h2>Confidence of all fields</h2>
          <Bars labels={BUCKET_LABELS} values={s.buckets} />
          <h2 className="gap">Documents by type</h2>
          {types.length ? <Bars labels={types} values={types.map((t) => s.byType[t])} /> : <p className="note">No finished documents yet.</p>}
          <h2 className="gap">Most corrected fields</h2>
          {topFixed.length ? <Bars labels={topFixed.map(([k]) => label(k))} values={topFixed.map(([, n]) => n)} /> : <p className="note">No corrections yet. Edit a value in Review and it shows here.</p>}
          <p className="note gap">Confidence is the model&apos;s own estimate. Treat it as a routing signal, not proof.</p>
        </section>
      </div>
    </main>
  );
}
