with open('build_full_pages_report.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'Content-Disposition' in l and 'setHeader' in l:
        print(f"Fixing line {i+1}: {repr(l)}")
        lines[i] = "        \"    res.setHeader('Content-Disposition', 'attachment; filename=' + evidence.originalFilename);\",\n"
        break

with open('build_full_pages_report.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

import ast
with open('build_full_pages_report.py', 'r', encoding='utf-8') as f:
    ast.parse(f.read())
print("build_full_pages_report.py syntax is 100% VALID!")
