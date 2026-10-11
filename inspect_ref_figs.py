import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

ref_pdf = r"C:\Users\asara\.gemini\antigravity\brain\b269d407-b886-4b14-935d-10713cbae19e\media__1791721174745.pdf"
reader = pypdf.PdfReader(ref_pdf)
for p in range(23, 29): # pages 24 to 29
    page = reader.pages[p]
    print(f"\n================ REF PAGE {p+1} ================")
    print(f"Images count: {len(page.images)}")
    lines = [l.strip() for l in page.extract_text().split('\n') if l.strip()]
    for l in lines:
        if any(keyword in l for keyword in ["9.", "Fig", "Table", "TABLE", "Figure", "10.", "CHAPTER"]):
            print(" ", l[:70])
