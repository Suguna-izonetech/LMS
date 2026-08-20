import json
from sqlalchemy.orm import Session
from app.models.all_models import Workflow, WorkflowExecutionLog, User, CourseEnrollment
import logging

logger = logging.getLogger(__name__)

class WorkflowEngine:
    @staticmethod
    def dispatch_event(db: Session, institute_id: int, event_name: str, payload: dict):
        workflows = db.query(Workflow).filter(
            Workflow.institute_id == institute_id,
            Workflow.trigger_event == event_name,
            Workflow.is_active == True
        ).all()
        
        for wf in workflows:
            try:
                # 1. Evaluate conditions
                conditions = json.loads(wf.conditions)
                passed = True
                for cond in conditions:
                    field = cond.get("field")
                    operator = cond.get("operator")
                    val = cond.get("value")
                    if field in payload:
                        payload_val = payload[field]
                        if operator == ">" and not (payload_val > val): passed = False
                        if operator == "==" and not (payload_val == val): passed = False
                
                if not passed:
                    continue
                
                # 2. Execute actions
                for action in wf.actions:
                    WorkflowEngine._execute_action(db, action.action_type, json.loads(action.action_payload), payload)
                
                # 3. Log Success
                log = WorkflowExecutionLog(
                    workflow_id=wf.id,
                    trigger_payload=json.dumps(payload),
                    status="Success"
                )
                db.add(log)
            except Exception as e:
                logger.error(f"Workflow execution failed: {e}")
                log = WorkflowExecutionLog(
                    workflow_id=wf.id,
                    trigger_payload=json.dumps(payload),
                    status="Failed",
                    error_message=str(e)
                )
                db.add(log)
            db.commit()

    @staticmethod
    def _execute_action(db: Session, action_type: str, action_payload: dict, event_payload: dict):
        if action_type == "Create Enrollment":
            if "student_id" in event_payload and "course_id" in event_payload:
                existing = db.query(CourseEnrollment).filter_by(
                    student_id=event_payload["student_id"],
                    course_id=event_payload["course_id"]
                ).first()
                if not existing:
                    enroll = CourseEnrollment(
                        student_id=event_payload["student_id"],
                        course_id=event_payload["course_id"],
                        status=action_payload.get("status", "active")
                    )
                    db.add(enroll)
        elif action_type == "Send Email":
            print(f"Mock Action: Sending Email to student_id {event_payload.get('student_id')} using template {action_payload.get('template')}")
        elif action_type == "Grant Course Access":
            print("Mock Action: Granting course access")
        else:
            print(f"Unsupported action type: {action_type}")
