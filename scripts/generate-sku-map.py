#!/usr/bin/env python3
"""Extract SKUs from SKUSoldByLineItem.xlsx and classify each into
category (Carpet/Tile/Vinyl/Hardwood-Laminate/Backsplash/Other) and
stream (install/removal/furniture/detail/pad/ancillary/adjustment).
Outputs lib/sku-data.json for the budget dashboard.
"""
import openpyxl
import json
import re
from collections import defaultdict

SRC = "/Users/it/Downloads/budget/SKUSoldByLineItem.xlsx"
OUT = "lib/sku-data.json"

CATEGORIES = ["Carpet", "Tile", "Vinyl", "Hardwood/Laminate", "Backsplash"]
STREAMS = ["install", "removal", "furniture", "detail", "pad", "ancillary", "adjustment"]

PREFIX_RE = re.compile(r"^[A-Z]{2}-\d{2}-?\s*")

# Manual overrides for tricky SKUs: sku -> (category, stream)
OVERRIDES = {
    # XL / large format are tile install add-ons
    "1097476": ("Tile", "ancillary"),
    "808996": ("Tile", "ancillary"),
    # Advanced birdcage/wedge/pie (stairs) -> carpet stair labor
    "503233": ("Carpet", "install"),
}


def clean(text):
    text = (text or "").strip()
    text = PREFIX_RE.sub("", text)
    return text.strip()


def classify(sku, desc_raw):
    if sku in OVERRIDES:
        return OVERRIDES[sku]
    t = clean(desc_raw).upper()

    # stream
    if t.startswith("PAD ") or t.startswith("PAD "):
        stream = "pad"
    elif "ADJUSTMENT" in t:
        stream = "adjustment"
    elif "REMOVAL" in t or "REMOVE" in t or "HAUL" in t or "RMV" in t:
        stream = "removal"
    elif "DETAIL" in t:
        stream = "detail"
    elif "FURNITURE" in t or "MOVE" in t or "MOVING" in t:
        stream = "furniture"
    elif any(k in t for k in [
        "INSTALL", "BASIC LABOR", "BASIC", "LABOR", "RAPID", "EMBOSSING",
        "UNDERLAYMENT", "BACKERBOARD", "PLYWOOD", "LEVELING", "SUBFLOOR",
        "GRINDING", "SKIM", "CUTOUT", "TRANSITIONS", "STEP", "STAIR",
        "BOX", "CAP", "CUSTOM WORK", "QTR", "PREP",
    ]):
        stream = "install"
    elif any(k in t for k in [
        "TRIP", "MILEAGE", "ACCESS", "UPCHARGE", "MINIMUM", "ACCLIMATION",
        "APPLIANCE", "TOILET", "DOOR", "UNDERCUT", "CABINET", "FEE",
        "PROJECT", "SEAL", "FORMAT", "SMALL JOB", "HANDLING",
    ]):
        stream = "ancillary"
    else:
        stream = "other"

    # category
    if "BACKSPLASH" in t or "BACKSPLSH" in t:
        cat = "Backsplash"
    elif "TILE" in t or "STONE" in t:
        cat = "Tile"
    elif "VINYL" in t or "LVP" in t or "LVT" in t or "VCT" in t or "HYBRID" in t or "RESILIENT" in t:
        cat = "Vinyl"
    elif "CARPET" in t:
        cat = "Carpet"
    elif ("LAM" in t or "LAMINATE" in t or "CORK" in t or "HWOOD" in t
          or "HARDWOOD" in t or "WOOD" in t
          or re.search(r"\b(HWD|HW)\b", t)):
        cat = "Hardwood/Laminate"
    else:
        cat = "Other"

    # pad is always carpet padding
    if stream == "pad":
        cat = "Carpet"

    return (cat, stream)


def num_or_none(v):
    if v is None or v == "":
        return None
    try:
        f = float(v)
        return f
    except (TypeError, ValueError):
        return None


def main():
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    ws = wb["SKUSoldByLineItem"]
    rows = list(ws.iter_rows(values_only=True))

    def g(r, i):
        return str(r[i]).strip() if len(r) > i and r[i] else ""

    skus = []  # list of dicts
    seen = set()
    # First pass: collect SKU identity + grand totals.
    # Grand total row per SKU is where District=='Total' AND Store#=='Total'.
    totals = {}  # sku -> dict(totalCount, totalCost, totalPayment, margin, pct)
    current_sku = None
    for r in rows[3:]:
        sku = g(r, 0)
        dist = g(r, 2)
        store = g(r, 3)
        if sku and sku not in ("Total", "SKU"):
            current_sku = sku
        # Per-SKU grand total row: District=='Total' and Store#=='Total' and SKU col is blank.
        # The file's final overall grand total (SKU col == 'Total') is excluded.
        if dist == "Total" and store == "Total" and current_sku and sku != "Total":
            totals[current_sku] = {
                "totalCount": num_or_none(r[10] if len(r) > 10 else None),
                "totalCost": num_or_none(r[11] if len(r) > 11 else None),
                "totalPayment": num_or_none(r[12] if len(r) > 12 else None),
                "margin": num_or_none(r[13] if len(r) > 13 else None),
                "pct": num_or_none(r[14] if len(r) > 14 else None),
            }

    for r in rows[3:]:
        sku = g(r, 0)
        if not sku or sku in ("Total", "SKU"):
            continue
        if sku in seen:
            continue
        seen.add(sku)
        gen = g(r, 1)
        det = g(r, 4) or gen
        desc = clean(det)
        cat, stream = classify(sku, det)
        skus.append({
            "sku": sku,
            "desc": desc,
            "category": cat,
            "stream": stream,
            "general": gen,
            **(totals.get(sku) or {}),
        })

    # group for convenience
    by_cat = {}
    for c in CATEGORIES + ["Other"]:
        by_cat[c] = {s: [] for s in STREAMS + ["other"]}
    for s in skus:
        by_cat[s["category"]][s["stream"]].append(s["sku"])

    out = {
        "source": "SKUSoldByLineItem.xlsx",
        "note": "Catalog-level SKU->category x stream association + per-SKU grand totals (FY2026-dominant).",
        "categories": CATEGORIES,
        "streams": STREAMS,
        "skus": skus,
        "byCategory": by_cat,
    }
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2)
    print(f"Wrote {len(skus)} SKUs -> {OUT}")
    missing = [s for s in skus if "totalCount" not in s]
    print(f"SKUs missing grand totals: {len(missing)}")

    # summary
    print("\n=== summary (category x stream) ===")
    for c in CATEGORIES + ["Other"]:
        counts = {s: len(by_cat[c][s]) for s in STREAMS + ["other"] if by_cat[c][s]}
        if counts:
            print(f"{c:20s} " + ", ".join(f"{k}={v}" for k, v in counts.items()))

    other = [s for s in skus if s["stream"] == "other" or s["category"] == "Other"]
    print("\n=== category=Other or stream=other (review) ===")
    for s in other:
        print(f"  {s['sku']:8s} | {s['category']:20s} | {s['stream']:10s} | {s['desc']}")


if __name__ == "__main__":
    main()
