import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

ref_pdf = r"C:\Users\asara\.gemini\antigravity\brain\b269d407-b886-4b14-935d-10713cbae19e\media__1791721174745.pdf"
reader = pypdf.PdfReader(ref_pdf)
for p in [22, 23, 24, 25]: # Pages 23, 24, 25, 26
    print(f"\n================ REF PAGE {p+1} ================")
    text = reader.pages[p].extract_text()
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for l in lines[:4]:
        print(' TOP:', l)
    for l in lines[-4:]:
        print(' BOT:', l)
