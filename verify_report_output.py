import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import pymupdf

pdf_path = r"C:\Users\asara\OneDrive\Documents\cloudevidence\civic evidence.pdf"
doc = pymupdf.open(pdf_path)

print(f"============================================================")
print(f"TOTAL PAGES: {len(doc)} (Target: exactly 30)")
print(f"============================================================")

for idx, p in enumerate(doc):
    text = p.get_text().strip()
    first_l = text.splitlines()[0] if text else "[EMPTY]"
    last_l = text.splitlines()[-1] if text else "[EMPTY]"
    blocks = [b for b in p.get_text('blocks') if 60 < b[1] < 735]
    last_b = blocks[-1] if blocks else None
    y1 = last_b[3] if last_b else 0
    print(f"P{idx+1:02d}: y1={y1:5.1f} | first='{first_l[:35]}' ... last='{last_l[:35]}'")
