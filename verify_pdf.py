import pypdf
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

ref_pdf = r"C:\Users\asara\.gemini\antigravity\brain\b269d407-b886-4b14-935d-10713cbae19e\media__1791721174745.pdf"
new_pdf = "civic evidence.pdf"

print("--- REFERENCE PDF 1 (Mohanganesh) ---")
r_reader = pypdf.PdfReader(ref_pdf)
print(f"Total pages: {len(r_reader.pages)}")
for i in range(min(5, len(r_reader.pages))):
    text = r_reader.pages[i].extract_text() or ""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    first = lines[0] if lines else "EMPTY"
    last = lines[-1] if lines else "EMPTY"
    print(f"Ref Page {i+1}: First='{first[:40]}' | Last='{last[:40]}'")

print("\n--- NEW CIVIC EVIDENCE PDF ---")
n_reader = pypdf.PdfReader(new_pdf)
print(f"Total pages: {len(n_reader.pages)}")
for i, page in enumerate(n_reader.pages):
    text = page.extract_text() or ""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    first = lines[0] if lines else "EMPTY"
    last = lines[-1] if lines else "EMPTY"
    print(f"Page {i+1:2d} (chars={len(text):4d}): First='{first[:35]}' | Last='{last[:35]}'")
