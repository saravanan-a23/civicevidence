import docx

doc = docx.Document(r"C:\Users\asara\Downloads\DOC-20261011-WA0000.docx")
found = False
count = 0
for p in doc.paragraphs:
    if "APPENDIX A" in p.text.upper():
        found = True
    if found:
        count += 1
        if count <= 25:
            print(f"P: {repr(p.text)}")
print(f"Total paragraphs in original Appendix A: {count}")
