from sqlalchemy.orm import Session
from app.models.call import Call
from app.schemas.call import CallCreate
from datetime import datetime
from fastapi import HTTPException

# Get all calls
def get_all_calls(db: Session):
    return db.query(Call).all()

# Create a call
def create_call(db: Session, call: CallCreate):
    db_call = Call(**call.dict())
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call

# Update call status
def update_call_status(db: Session, call_id: int, status: str):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    call.status = status
    if status == "CONNECTED":
        call.end_time = datetime.utcnow()
        if call.start_time:
            call.duration = int((call.end_time - call.start_time).total_seconds())
    db.commit()
    db.refresh(call)
    return call

# Delete call
def delete_call(db: Session, call_id: int):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        return None
    db.delete(call)
    db.commit()
    return call

