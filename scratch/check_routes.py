import sys
import os

sys.path.insert(0, os.path.abspath("backend"))

try:
    from app.main import app
    print("Successfully imported app.main!")
except Exception as e:
    import traceback
    print("Error importing app.main:")
    traceback.print_exc()
