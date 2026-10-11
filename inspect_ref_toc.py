import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

ref_pdf = r"C:\Users\asara\.gemini\antigravity\brain\b269d407-b886-4b14-935d-10713cbae19e\media__1791721174745.pdf"
reader = pypdf.PdfReader(ref_pdf)
print("=== REFERENCE PDF 1 TOC (PAGE 5) ===")
print(reader.pages[4].extract_text())
