import os
import pypdf
import sys

sys.stdout.reconfigure(encoding='utf-8')

def check_pdf(pdf_path):
    print(f"\n================ INSPECTING {pdf_path} ================")
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total pages: {len(reader.pages)}")
    for i, page in enumerate(reader.pages):
        y_coords = []
        def visitor(text, cm, tm, font_dict, font_size):
            if text.strip() and tm[5] > 45:
                y_coords.append((tm[5], text.strip()))
        page.extract_text(visitor_text=visitor)
        if y_coords:
            y_coords.sort(key=lambda x: x[0])
            lowest = y_coords[0]
            highest = y_coords[-1]
            gap = lowest[0] - 38.5
            print(f"Page {i+1:2d} (imgs={len(page.images):d}): top_y={highest[0]:5.1f} | bot_y={lowest[0]:5.1f} | gap={gap:5.1f} pt ({gap/72.0:4.2f} in) | last='{lowest[1][:45]}'")
        else:
            print(f"Page {i+1:2d} (imgs={len(page.images):d}): NO TEXT FOUND!")

if __name__ == "__main__":
    check_pdf("civic evidence.pdf")
