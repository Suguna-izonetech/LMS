import os
import shutil
from fastapi import UploadFile
from pathlib import Path
import uuid

class StorageService:
    UPLOAD_DIR = Path("uploads")

    @classmethod
    def setup(cls):
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    @classmethod
    def save_file(cls, file: UploadFile, subfolder: str = "") -> str:
        cls.setup()
        
        target_dir = cls.UPLOAD_DIR
        if subfolder:
            target_dir = cls.UPLOAD_DIR / subfolder
            target_dir.mkdir(parents=True, exist_ok=True)
            
        # Generate unique filename to avoid collisions
        unique_id = uuid.uuid4().hex[:8]
        safe_filename = f"{unique_id}_{file.filename}"
        
        file_path = target_dir / safe_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return relative URL path
        if subfolder:
            return f"/uploads/{subfolder}/{safe_filename}"
        return f"/uploads/{safe_filename}"
