import type { RefObject } from "react";
import { toCheck, type Doc, type Thresholds } from "@/lib/types";

export type Filter = "all" | "review" | "approved";

type Props = {
  docs: Doc[];
  total: number;
  selectedId: string | null;
  filter: Filter;
  onFilter: (f: Filter) => void;
  typeFilter: string;
  onType: (t: string) => void;
  types: string[];
  query: string;
  onQuery: (q: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  thresholds: Thresholds;
  onSelect: (id: string) => void;
};

const FILTERS: [Filter, string][] = [["all", "All"], ["review", "To check"], ["approved", "Approved"]];

export function Queue(p: Props) {
  return (
    <section className="queue" aria-labelledby="q-h">
      <div className="panel-head">
        <h2 id="q-h">Queue</h2>
        <div className="seg" role="group" aria-label="Filter queue">
          {FILTERS.map(([key, text]) => (
            <button key={key} type="button" aria-pressed={p.filter === key} onClick={() => p.onFilter(key)}>{text}</button>
          ))}
        </div>
      </div>
      <div className="tools">
        <input ref={p.searchRef} className="v" type="search" name="q" placeholder="Search names and values" aria-label="Search documents" autoComplete="off" value={p.query} onChange={(e) => p.onQuery(e.target.value)} />
        {p.types.length > 1 && (
          <select className="v" name="type" aria-label="Document type" value={p.typeFilter} onChange={(e) => p.onType(e.target.value)}>
            <option value="all">All types</option>
            {p.types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>
      <table>
        <thead>
          <tr><th scope="col">Document</th><th scope="col">Type</th><th scope="col" className="num">To check</th></tr>
        </thead>
        <tbody>
          {p.docs.map((d) => {
            const n = toCheck(d, p.thresholds);
            return (
              <tr key={d.id} className={d.id === p.selectedId ? "on" : undefined}>
                <td>
                  <button type="button" className="pick" aria-current={d.id === p.selectedId} onClick={() => p.onSelect(d.id)}>
                    {d.status === "loading" ? <span className="skel" aria-label={`Reading ${d.name}`} /> : d.name}
                  </button>
                </td>
                <td>{d.status === "loading" ? <span className="skel" /> : d.status === "error" ? "Failed" : d.type}</td>
                <td className="num">{d.approved ? "Done" : d.status === "ready" ? n : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {p.docs.length === 0 && (
        <p className="note">{p.total === 0 ? "No documents yet." : "Nothing matches these filters."}</p>
      )}
    </section>
  );
}
