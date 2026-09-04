import os

for root, dirs, files in os.walk("frontend/src"):
    for f in files:
        if f.endswith(".tsx"):
            full_path = os.path.join(root, f)
            with open(full_path, "r", encoding="utf-8") as fp:
                content = fp.read()
            if "usePagination(" in content:
                # Check where usePagination is called relative to loading/error returns or if inside IIFE
                lines = content.splitlines()
                first_return_line = None
                for idx, l in enumerate(lines):
                    if ("return (" in l or "return <" in l or l.strip().startswith("if (uiState") or l.strip().startswith("if (loading")) and "usePagination" not in l:
                        if first_return_line is None and ("uiState" in l or "loading" in l):
                            first_return_line = idx + 1
                    if "usePagination(" in l:
                        p_line = idx + 1
                        is_after_return = (first_return_line is not None and p_line > first_return_line)
                        is_in_iife = "{(() => {" in content
                        print(f"File: {full_path}")
                        print(f"  usePagination at line {p_line}, first early return at line {first_return_line}, after return? {is_after_return}, in IIFE? {is_in_iife}")
