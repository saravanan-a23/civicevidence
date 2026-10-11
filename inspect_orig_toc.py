import docx

doc = docx.Document(r"C:\Users\asara\Downloads\DOC-20261011-WA0000.docx")
for t in doc.tables:
    for row in t.rows:
        text = " | ".join(c.text.strip() for c in row.cells)
        if "APPENDIX" in text.upper():
            print(text)
