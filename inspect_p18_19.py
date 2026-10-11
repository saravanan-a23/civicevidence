import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

reader = pypdf.PdfReader("civic evidence.pdf")
for p in [17, 18]: # pages 18 and 19
    print(f"\n================ PAGE {p+1} ================")
    text = reader.pages[p].extract_text()
    for line in text.split('\n'):
        if line.strip():
            print(line.strip())
