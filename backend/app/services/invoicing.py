from sqlalchemy.orm import Session
from app.models.all_models import InstituteBillingConfig, Invoice, Transaction
from datetime import datetime

class InvoiceService:
    @staticmethod
    def generate_invoice(db: Session, institute_id: int, student_id: int, course_id: int, transaction_id: int, amount: float, payment_ref: str):
        config = db.query(InstituteBillingConfig).filter_by(institute_id=institute_id).first()
        
        if not config:
            # Fallback if config is missing
            prefix = "INV-"
            next_num = 1
            tax_rate = 0.0
            gst_enabled = False
        else:
            prefix = config.invoice_prefix
            next_num = config.next_invoice_number
            tax_rate = config.tax_percentage / 100.0 if config.gst_enabled else 0.0
            
            # Increment next invoice number
            config.next_invoice_number += 1
            db.commit()
            
        invoice_number = f"{prefix}{str(next_num).zfill(6)}"
        
        # Calculate backward from inclusive total
        subtotal = amount / (1 + tax_rate)
        tax_amount = amount - subtotal
        
        inv = Invoice(
            institute_id=institute_id,
            invoice_number=invoice_number,
            student_id=student_id,
            course_id=course_id,
            transaction_id=transaction_id,
            subtotal=round(subtotal, 2),
            tax_amount=round(tax_amount, 2),
            total_amount=amount,
            payment_reference=payment_ref,
            status="Paid"
        )
        
        db.add(inv)
        db.commit()
        return inv
