#!/usr/bin/env python3
import csv
import io
import json
import shutil
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

SHEET_ID = "1TqIvMr7oR3lyNvpS3rx7qf5pRunOvm3ytG8vmN_EC7A"
SHEET_NAME = "Sheet1"
OUTPUT_PATH = Path(__file__).parent / "SRC" / "data.json"
CURL_BIN = shutil.which("curl") or "/usr/bin/curl"


def build_csv_url(sheet_id: str, sheet_name: str) -> str:
    params = urllib.parse.urlencode({
        "tqx": "out:csv",
        "sheet": sheet_name,
    })
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?{params}"


def load_rows(csv_url: str):
    try:
        with urllib.request.urlopen(csv_url, timeout=30) as response:
            raw = response.read().decode("utf-8", errors="replace")
    except Exception:
        result = subprocess.run(
            [CURL_BIN, "-L", "--silent", csv_url],
            check=True,
            capture_output=True,
            text=True,
        )
        raw = result.stdout

    reader = csv.reader(io.StringIO(raw))
    return list(reader)


def normalize_header(value: str) -> str:
    return (value or "").strip().lower()


def main() -> None:
    csv_url = build_csv_url(SHEET_ID, SHEET_NAME)
    rows = load_rows(csv_url)

    if not rows:
        raise RuntimeError("No se encontraron filas en el Sheet.")

    header = [normalize_header(column) for column in rows[0]]
    sku_idx = 0
    name_idx = 1
    link_idx = 2

    for index, column in enumerate(header):
        if "sku" in column:
            sku_idx = index
        elif "nombre" in column or "name" in column:
            name_idx = index
        elif "link" in column or "pdf" in column:
            link_idx = index

    products = []
    for row in rows[1:]:
        sku = row[sku_idx].strip() if sku_idx < len(row) else ""
        name = row[name_idx].strip() if name_idx < len(row) else ""
        pdf = row[link_idx].strip() if link_idx < len(row) else ""

        if not sku and not name:
            continue

        products.append({
            "sku": sku,
            "name": name,
            "pdf": pdf,
        })

    OUTPUT_PATH.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ data.json actualizado: {OUTPUT_PATH}")
    print(f"📦 Productos cargados: {len(products)}")


if __name__ == "__main__":
    main()
