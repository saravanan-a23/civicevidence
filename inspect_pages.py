import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

reader = pypdf.PdfReader("civic evidence.pdf")

print("=== PAGE 1 (COVER) ===")
print(reader.pages[0].extract_text())

print("\n=== PAGE 2 (BONAFIDE) ===")
print(reader.pages[1].extract_text())

print("\n=== PAGE 3 (DECLARATION) ===")
print(reader.pages[2].extract_text())

print("\n=== PAGE 5 (TABLE OF CONTENTS) ===")
print(reader.pages[4].extract_text())
