import ast
import os
import sys

sys.path.insert(0, os.path.abspath("backend"))
from app.models import all_models

model_names = set(dir(all_models))

def check_undefined_names(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        tree = ast.parse(f.read(), filename=filepath)
        
    imported_names = set()
    defined_names = set()
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imported_names.add(alias.asname or alias.name)
        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                imported_names.add(alias.asname or alias.name)
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            defined_names.add(node.name)
        elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
            defined_names.add(node.id)

    # Now find load instances of Names that look like classes or models
    missing = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
            name = node.id
            if name[0].isupper() and name not in imported_names and name not in defined_names and name not in dir(__builtins__):
                missing.add(name)
                
    print(f"File: {filepath}")
    print(f"  Potentially undefined uppercase symbols: {missing}")

for r in ["institute_admin.py", "teacher.py", "student.py", "auth.py"]:
    check_undefined_names(os.path.join("backend", "app", "routers", r))
