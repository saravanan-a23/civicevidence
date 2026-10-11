import win32com.client
import os

word = win32com.client.DispatchEx("Word.Application")
word.Visible = False
doc_path = os.path.abspath(r"C:\Users\asara\OneDrive\Documents\cloudevidence\CivicEvidence_Report_Formatted.docx")
doc = word.Documents.Open(doc_path)
doc.Repaginate()

print(f"Total sections: {doc.Sections.Count}")
sec2_range = doc.Sections(2).Range
find_rng = sec2_range.Duplicate
find = find_rng.Find
find.Text = "1. ORGANIZATION AND INDUSTRY EXPOSURE"
if find.Execute():
    print("wdActiveEndPageNumber (1):", find_rng.Information(1))
    print("wdActiveEndAdjustedPageNumber (3):", find_rng.Information(3))

word.Quit()
