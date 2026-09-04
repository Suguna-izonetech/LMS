import os
import re

frontend_pages_dir = "frontend/src/pages"
files_with_iife = []

for root, dirs, files in os.walk(frontend_pages_dir):
    for f in files:
        if f.endswith(".tsx"):
            full_path = os.path.join(root, f)
            with open(full_path, "r", encoding="utf-8") as fp:
                content = fp.read()
                if "usePagination" in content:
                    # check if usePagination is inside (() => {
                    if re.search(r'\{\s*\(\s*\)\s*=>\s*\{[^}]*usePagination', content, re.DOTALL):
                        files_with_iife.append(full_path)
                    elif re.search(r'function\s+\w+.*usePagination', content):
                        pass

print("Files with usePagination inside JSX/IIFE:")
for f in files_with_iife:
    print(f)
