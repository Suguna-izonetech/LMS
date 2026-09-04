import os
import re

for root, dirs, files in os.walk("frontend/src"):
    for f in files:
        if f.endswith(".tsx"):
            full_path = os.path.join(root, f)
            with open(full_path, "r", encoding="utf-8") as fp:
                lines = fp.readlines()
                for idx, line in enumerate(lines):
                    if "usePagination(" in line:
                        print(f"{full_path}:{idx+1}: {line.strip()}")
