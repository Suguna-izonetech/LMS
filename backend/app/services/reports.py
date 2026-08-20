import os
import uuid
import asyncio
from datetime import datetime
from app.db.database import SessionLocal
from app.models.all_models import ReportHistory, Transaction, User, Course

class ReportService:
    @staticmethod
    async def process_report_async(report_id: int, institute_id: int, report_type: str):
        # Simulate heavy background processing
        await asyncio.sleep(5)
        
        db = SessionLocal()
        try:
            rh = db.query(ReportHistory).filter_by(id=report_id).first()
            if not rh:
                return
            
            # Generate dummy CSV content
            csv_content = f"ID,Name,Date\n1,Sample {report_type},{datetime.utcnow()}"
            
            # Save file locally
            filename = f"report_{uuid.uuid4().hex}.csv"
            filepath = os.path.join("uploads", filename)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(csv_content)
                
            rh.file_url = f"/uploads/{filename}"
            rh.status = "Completed"
            db.commit()
        except Exception as e:
            rh = db.query(ReportHistory).filter_by(id=report_id).first()
            if rh:
                rh.status = "Failed"
                db.commit()
        finally:
            db.close()
