# Freight extract (MVP)

Upload freight PDFs (rate confirmation, BOL, carrier invoice), get fields with confidence, fix flagged ones, export CSV/JSON.

Stack: FastAPI API (`app.py`) + Next.js UI (`web/`, Hallmark "Dose" theme, light and dark).

```
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
export OPENAI_API_KEY=...           # set in your own terminal, never paste it in chat
.venv/bin/uvicorn app:app --port 8010

cd web && npm install && npm run dev   # http://localhost:3000
```

Pages: Dashboard (stats, confidence chart, needs attention), Review (source beside fields), Documents (search, sort, bulk approve/export/remove), Fields (per-field confidence and your corrections), Settings (thresholds, API status, data), Help. Ctrl/Cmd+K opens search; theme is System, Light or Dark.

`/api/*` is proxied to the API (`API_URL`, default http://127.0.0.1:8010).

Not built yet: OCR for scanned PDFs, auth, server-side storage, TMS integration.
