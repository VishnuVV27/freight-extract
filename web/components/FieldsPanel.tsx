import { invalid, label, needsCheck, tierOf, type Doc, type Thresholds } from "@/lib/types";

type Props = {
  doc: Doc | null;
  thresholds: Thresholds;
  canRetry: boolean;
  onActive: (key: string) => void;
  onChange: (key: string, value: string) => void;
  onConfirm: (key: string) => void;
  onConfirmAll: () => void;
  onApprove: () => void;
  onRemove: () => void;
  onCopy: () => void;
  onRetry: () => void;
};

const WORDS = { review: "Check this", stop: "Enter by hand" } as const;

export function FieldsPanel(p: Props) {
  const d = p.doc;
  return (
    <section className="review" aria-labelledby="r-h">
      <div className="panel-head">
        <h2 id="r-h">Fields</h2>
        {d?.status === "ready" && <span className="note">{d.type}</span>}
      </div>

      {!d && <p className="note">Select a document.</p>}

      {d?.status === "loading" && (
        <div className="state" role="status">
          <strong>Reading the document</strong>
          Extracting text and fields. This usually takes a few seconds.
        </div>
      )}

      {d?.status === "error" && (
        <div className="state err" role="alert">
          <strong>This document failed</strong>
          {d.error}
          <div className="review-foot">
            {p.canRetry && <button type="button" className="btn" onClick={p.onRetry}>Try again</button>}
            <button type="button" className="btn" onClick={p.onRemove}>Remove</button>
          </div>
        </div>
      )}

      {d?.status === "ready" && (
        <>
          <table>
            <thead>
              <tr><th scope="col">Field</th><th scope="col">Value</th><th scope="col" className="num">Score</th></tr>
            </thead>
            <tbody>
              {Object.entries(d.fields).map(([key, f]) => {
                const bad = invalid(key, f.value);
                const tier = needsCheck(key, f, p.thresholds) ? (tierOf(key, f.confidence, p.thresholds) === "ok" ? "review" : tierOf(key, f.confidence, p.thresholds)) : "ok";
                return (
                  <tr key={key} className={tier === "ok" ? undefined : `${tier}-row`}>
                    <td>{label(key)}</td>
                    <td>
                      <input className="v" name={key} type="text" autoComplete="off" aria-label={label(key)} value={f.value} onFocus={() => p.onActive(key)} onChange={(e) => p.onChange(key, e.target.value)} />
                      {tier !== "ok" ? (
                        <span className="status">{bad ? "Format looks off" : WORDS[tier]}. <button type="button" onClick={() => p.onConfirm(key)}>Looks right</button></span>
                      ) : f.confirmed && f.confidence < p.thresholds.ok ? (
                        <span className="status">Confirmed by you</span>
                      ) : null}
                    </td>
                    <td className="num">{f.confidence.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="review-foot">
            <button type="button" className="btn btn-primary" onClick={p.onApprove}>{d.approved ? "Reopen document" : "Approve document"}</button>
            <button type="button" className="btn" onClick={p.onConfirmAll}>Confirm all fields</button>
            <button type="button" className="btn" onClick={p.onCopy}>Copy JSON</button>
            <button type="button" className="btn" onClick={p.onRemove}>Remove</button>
          </div>
        </>
      )}
    </section>
  );
}
