import pypdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

reader = pypdf.PdfReader("civic evidence.pdf")
print(f"Total pages: {len(reader.pages)}")

for idx, page in enumerate(reader.pages):
    min_y = [1000.0]
    max_y = [0.0]
    text_elements = []
    
    def visitor(text, cm, tm, font_dict, font_size):
        if text.strip():
            y = tm[5]
            # Ignore the footer itself (which is around y=38 to y=55)
            if y > 55:
                if y < min_y[0]:
                    min_y[0] = y
                if y > max_y[0]:
                    max_y[0] = y
                text_elements.append((y, text.strip()))
                
    page.extract_text(visitor_text=visitor)
    
    # Sort text elements by y descending (top to bottom)
    text_elements.sort(key=lambda item: item[0], reverse=True)
    
    first = text_elements[0][1] if text_elements else "NO TEXT"
    last = text_elements[-1][1] if text_elements else "NO TEXT"
    
    # Check if page has images
    num_images = len(page.images)
    
    print(f"Page {idx+1:2d} (imgs={num_images}): min_y={min_y[0]:5.1f}, max_y={max_y[0]:5.1f} | Top: '{first[:28]}' | Bot: '{last[:35]}'")
