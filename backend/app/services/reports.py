import os
import uuid
import csv
import io
import asyncio
from datetime import datetime
from app.db.database import SessionLocal
from app.models.all_models import (
    ReportHistory, Transaction, User, Course, Student, Lead, CertificateRecord, Batch
)

class ReportService:
    @staticmethod
    async def process_report_async(report_id: int, institute_id: int, report_type: str):
        # Allow short asynchronous queue processing
        await asyncio.sleep(2)
        
        db = SessionLocal()
        try:
            rh = db.query(ReportHistory).filter_by(id=report_id).first()
            if not rh:
                return
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Export actual real data based on report type
            if "User" in report_type:
                writer.writerow(["ID", "Username", "Email", "Phone", "Status", "Created At"])
                users = db.query(User).filter(User.institute_id == institute_id).all()
                for u in users:
                    writer.writerow([
                        u.id,
                        u.username,
                        u.email,
                        u.phone or "",
                        "Active" if u.is_active else "Inactive",
                        u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else ""
                    ])
            elif "Course" in report_type:
                writer.writerow(["ID", "Title", "Code", "Category", "Level", "Price", "Status", "Created At"])
                courses = db.query(Course).filter(Course.institute_id == institute_id).all()
                for c in courses:
                    writer.writerow([
                        c.id,
                        c.title,
                        c.code or "",
                        c.category or "",
                        c.level or "",
                        c.price or 0.0,
                        c.status or "",
                        c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else ""
                    ])
            elif "Transaction" in report_type:
                writer.writerow(["ID", "Invoice No", "Student Name", "Course Title", "Amount", "Payment Method", "Status", "Date"])
                transactions = db.query(Transaction).filter(Transaction.institute_id == institute_id).all()
                for t in transactions:
                    student_name = t.student.name if t.student else ""
                    course_title = t.course.title if t.course else ""
                    writer.writerow([
                        t.id,
                        t.invoice_number or "",
                        student_name,
                        course_title,
                        t.amount,
                        t.payment_method or "",
                        t.payment_status or "",
                        t.transaction_date.strftime("%Y-%m-%d %H:%M:%S") if t.transaction_date else ""
                    ])
            elif "Lead" in report_type:
                writer.writerow(["ID", "Name", "Phone", "Email", "Status", "Source", "Inquiry Date"])
                leads = db.query(Lead).filter(Lead.institute_id == institute_id).all()
                for l in leads:
                    writer.writerow([
                        l.id,
                        l.name,
                        l.phone or "",
                        l.email or "",
                        l.status or "",
                        l.source or "",
                        l.inquiry_date.strftime("%Y-%m-%d %H:%M:%S") if l.inquiry_date else ""
                    ])
            elif "Certificate" in report_type:
                writer.writerow(["ID", "Certificate Number", "Student Name", "Course Title", "Status", "Issue Date"])
                records = db.query(CertificateRecord).filter(CertificateRecord.institute_id == institute_id).all()
                for r in records:
                    student_name = r.student.name if r.student else ""
                    course_title = r.course.title if r.course else ""
                    writer.writerow([
                        r.id,
                        r.certificate_number,
                        student_name,
                        course_title,
                        r.status,
                        r.issue_date.strftime("%Y-%m-%d %H:%M:%S") if r.issue_date else ""
                    ])
            elif "Enrollment" in report_type:
                writer.writerow(["ID", "Student Name", "Roll No", "Batch Name", "Course Title", "Status", "Enrollment Date"])
                students = db.query(Student).filter(Student.institute_id == institute_id).all()
                for s in students:
                    batch_name = s.batch.name if s.batch else ""
                    course_title = s.batch.course.title if (s.batch and s.batch.course) else ""
                    writer.writerow([
                        s.id,
                        s.name,
                        s.roll_number or "",
                        batch_name,
                        course_title,
                        s.status or "Active",
                        s.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(s, 'created_at') and s.created_at else ""
                    ])
            elif "Activity" in report_type:
                writer.writerow(["ID", "Student Name", "Course Title", "Type", "Title", "Completed", "Score", "Time Spent (min)", "Activity Date"])
                activities = db.query(CourseActivity).join(Student, CourseActivity.student_id == Student.id).filter(Student.institute_id == institute_id).all()
                for a in activities:
                    student_name = a.student.name if a.student else ""
                    course_title = a.course.title if a.course else ""
                    writer.writerow([
                        a.id,
                        student_name,
                        course_title,
                        a.activity_type or "",
                        a.activity_title or "",
                        "Yes" if a.completed else "No",
                        a.score or 0.0,
                        a.time_spent_minutes or 0,
                        a.activity_date.strftime("%Y-%m-%d %H:%M:%S") if a.activity_date else ""
                    ])
            else:
                writer.writerow(["ID", "Report Type", "Institute ID", "Extracted At"])
                writer.writerow([1, report_type, institute_id, datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")])
            
            csv_content = output.getvalue()
            
            # Ensure uploads directory exists
            os.makedirs("uploads", exist_ok=True)
            filename = f"report_{uuid.uuid4().hex}.csv"
            filepath = os.path.join("uploads", filename)
            
            with open(filepath, "w", encoding="utf-8", newline="") as f:
                f.write(csv_content)
                
            rh.file_url = f"/uploads/{filename}"
            rh.status = "Completed"
            db.commit()
        except Exception as e:
            print(f"[REPORT SERVICE ERROR] {e}")
            rh = db.query(ReportHistory).filter_by(id=report_id).first()
            if rh:
                rh.status = "Failed"
                db.commit()
        finally:
            db.close()
