import ast
import os
import sys

sys.path.insert(0, os.path.abspath("backend"))
from app.models import all_models

model_names = set(dir(all_models))

def check_file_models(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    tree = ast.parse(content, filename=filepath)
    
    used_models = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
            if node.id in model_names or node.id.endswith("Lead") or node.id.endswith("Followup") or "Enroll" in node.id:
                used_models.add(node.id)
                
    print(f"File: {filepath}")
    print(f"  Used Model/Table Symbols: {sorted(list(used_models))}")

check_file_models("backend/app/routers/teacher.py")
check_file_models("backend/app/routers/student.py")
