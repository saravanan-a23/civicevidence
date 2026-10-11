import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

reader = pypdf.PdfReader("civic evidence.pdf")
for p in range(18, 25): # pages 19 to 25 (0-indexed 18 to 24)
    print(f"\n================ PAGE {p+1} ================")
    text = reader.pages[p].extract_text()
    for line in text.split('\n'):
        if line.strip():
            print(line.strip())
