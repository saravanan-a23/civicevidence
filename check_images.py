from PIL import Image
import glob
import os

img_dir = r"C:\Users\asara\OneDrive\Documents\cloudevidence\extracted_images"
for f in sorted(glob.glob(os.path.join(img_dir, "*"))):
    try:
        with Image.open(f) as img:
            w, h = img.size
            ratio = h / w
            print(f"{os.path.basename(f):25s}: {w}x{h} (aspect ratio h/w = {ratio:.2f}) -> at width 4.8 in, height = {4.8 * ratio:.2f} in")
    except Exception as e:
        pass
