export default function Help() {
  return (
    <main className="container narrow">
      <div className="page-head"><h1>Help</h1></div>

      <section>
        <h2>How it works</h2>
        <ol className="steps">
          <li>Add freight PDFs with the button, or drop them anywhere on the page.</li>
          <li>The text is read from the PDF and a model returns each field with a confidence score.</li>
          <li>Sure fields pass. Doubtful ones are highlighted in the source text so you can check them fast.</li>
          <li>Approve the document, then export CSV or JSON.</li>
        </ol>
      </section>

      <section className="gap">
        <h2>Colors in the field list</h2>
        <p><span className="chip chip-review">Yellow</span> the model is unsure, check it.</p>
        <p><span className="chip chip-stop">Red</span> very low confidence, enter it by hand.</p>
      </section>

      <section className="gap">
        <h2>Keyboard shortcuts on Review</h2>
        <dl className="kv">
          <div><dt>j / k</dt><dd>next / previous document</dd></div>
          <div><dt>a</dt><dd>approve the open document</dd></div>
          <div><dt>/</dt><dd>search the queue</dd></div>
        </dl>
      </section>

      <section className="gap">
        <h2>Good to know</h2>
        <ul className="steps">
          <li>Confidence is the model&apos;s own guess. It decides where you look, not what is true.</li>
          <li>Scanned PDFs with no text layer are rejected for now.</li>
          <li>Everything is saved in this browser only. Export to keep a copy.</li>
        </ul>
      </section>
    </main>
  );
}
