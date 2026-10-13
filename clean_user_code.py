import os
import re

with open('user_code_raw.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Strip block comments /** ... */ and /* ... */
text_clean = re.sub(r'/\*\*[\s\S]*?\*/', '', text)
text_clean = re.sub(r'/\*[\s\S]*?\*/', '', text_clean)

# Strip inline comments // ...
raw_lines = text_clean.splitlines()
clean_lines = []
for line in raw_lines:
    line_no_comment = re.sub(r'//.*$', '', line).rstrip()
    clean_lines.append(line_no_comment)

# Remove consecutive blank lines
filtered_lines = []
prev_blank = False
for line in clean_lines:
    if not line.strip():
        if not prev_blank:
            filtered_lines.append('')
            prev_blank = True
    else:
        filtered_lines.append(line)
        prev_blank = False

# Strip leading and trailing blank lines
while filtered_lines and not filtered_lines[0].strip():
    filtered_lines.pop(0)
while filtered_lines and not filtered_lines[-1].strip():
    filtered_lines.pop()

print(f"Total cleaned code lines (with minimal blank lines): {len(filtered_lines)}")
with open('cleaned_user_code.txt', 'w', encoding='utf-8') as f:
    for l in filtered_lines:
        f.write(l + '\n')
