import pypdf

reader = pypdf.PdfReader("civic evidence.pdf")
p32 = reader.pages[31] # 0-indexed 31 is Page 32
print(f"Page 32 text: {repr(p32.extract_text())}")
print(f"Page 32 images count: {len(p32.images)}")
for img in p32.images:
    print(f"Image name: {img.name}, size: {len(img.data)} bytes")
