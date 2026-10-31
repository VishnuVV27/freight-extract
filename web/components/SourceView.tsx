import { useEffect, useRef } from "react";
import type { Doc } from "@/lib/types";

export function SourceView({ doc, activeField }: { doc: Doc | null; activeField: string | null }) {
  const mark = useRef<HTMLElement>(null);
  const value = doc && activeField ? doc.fields[activeField]?.value.trim() : "";
  const text = doc?.text ?? "";
  let at = value ? text.indexOf(value) : -1;
  if (value && at < 0) at = text.toLowerCase().indexOf(value.toLowerCase());

  useEffect(() => {
    mark.current?.scrollIntoView({ block: "nearest" });
  }, [at, activeField, doc?.id]);

  return (
    <section className="viewer" aria-labelledby="v-h">
      <div className="panel-head">
        <h2 id="v-h">Source text</h2>
        {value && at < 0 && <span className="note">Not found in the text; the model may have reformatted it.</span>}
      </div>
      <pre className="paper" tabIndex={0}>
        {at >= 0 && value ? (
          <>
            {text.slice(0, at)}
            <mark ref={mark}>{text.slice(at, at + value.length)}</mark>
            {text.slice(at + value.length)}
          </>
        ) : (
          text || (doc?.status === "loading" ? "Reading the document." : "Select a document to see its text.")
        )}
      </pre>
    </section>
  );
}
