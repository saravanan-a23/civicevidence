import docx

doc = docx.Document(r"C:\Users\asara\Downloads\DOC-20261011-WA0000.docx")
for idx, p in enumerate(doc.paragraphs):
    if "APPENDIX" in p.text.upper():
        print(f"P {idx}: {repr(p.text)}")
