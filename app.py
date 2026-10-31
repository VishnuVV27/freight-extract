import io
import json
import os
import urllib.request

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.responses import FileResponse
from openai import OpenAI
from pypdf import PdfReader

app = FastAPI()

FIELDS = {
    "rate_confirmation": ["broker", "carrier", "load_number", "pickup_address", "pickup_date",
                          "delivery_address", "delivery_date", "rate_total", "currency"],
    "bill_of_lading": ["shipper", "consignee", "carrier", "bol_number", "ship_date",
                       "pieces", "weight", "description"],
    "carrier_invoice": ["carrier", "invoice_number", "invoice_date", "load_number",
                        "total_amount", "currency", "due_date"],
}

PROMPT = """Extract fields from this freight document text. First classify it as one of
{types}. Then return JSON: {{"doc_type": str, "fields": {{name: {{"value": str|null,
"confidence": 0..1}}}}}} using the field names for that type: {names}.
Use null when a value is absent; never guess. Confidence is your certainty the value is
exactly what the document says."""


@app.post("/webhook")
async def webhook(body: dict):
    url = str(body.get("url", ""))
    if not url.startswith(("http://", "https://")):
        raise HTTPException(400, "Webhook URL must start with http:// or https://")
    req = urllib.request.Request(url, json.dumps(body.get("payload")).encode(), {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return {"status": r.status}
    except Exception as e:
        raise HTTPException(502, f"Webhook failed: {e}")


@app.post("/extract")
async def extract(file: UploadFile):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(500, "OPENAI_API_KEY is not set in the server's environment")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "PDF only")
    reader = PdfReader(io.BytesIO(await file.read()))
    text = "\n".join(p.extract_text() or "" for p in reader.pages).strip()
    if not text:
        # shortcut: no OCR, scanned PDFs are rejected; add Textract/Document AI when customers send scans
        raise HTTPException(422, "No text layer (scanned PDF). OCR not implemented yet.")
    prompt = PROMPT.format(types=list(FIELDS), names=FIELDS)
    try:
        resp = OpenAI().chat.completions.create(
            model=os.getenv("MODEL", "gpt-4o-mini"),
            temperature=0,
            response_format={"type": "json_object"},
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": text[:30000]}],
        )
    except Exception as e:
        raise HTTPException(502, f"OpenAI error: {e}")
    data = json.loads(resp.choices[0].message.content)
    data["text"] = text
    return data


@app.get("/schema")
def schema():
    return FIELDS


@app.get("/health")
def health():
    return {"key_set": bool(os.getenv("OPENAI_API_KEY")), "model": os.getenv("MODEL", "gpt-4o-mini")}


@app.get("/sample")
def sample():
    return FileResponse("sample_rate_confirmation.pdf", media_type="application/pdf")

