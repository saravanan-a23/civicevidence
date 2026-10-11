import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

reader = pypdf.PdfReader("civic evidence.pdf")

for p_num in [4, 5, 20, 21, 22, 23, 24, 25]:
    page = reader.pages[p_num - 1]
    print(f"\n================ PAGE {p_num} ================")
    print(f"Images count: {len(page.images)}")
    for img in page.images:
        print(f"  Image: {img.name}, size: {img.image.size if hasattr(img, 'image') else 'unknown'}")
        
    def visitor(text, cm, tm, font_dict, font_size):
        if text.strip():
            print(f"  y={tm[5]:5.1f}, x={tm[4]:5.1f}, sz={font_size:4.1f}: {repr(text.strip()[:60])}")
            
    page.extract_text(visitor_text=visitor)
