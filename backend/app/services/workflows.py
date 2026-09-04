import json
from sqlalchemy.orm import Session
from app.models.all_models import Workflow, WorkflowExecutionLog, User, Student, Course
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
                conditions = json.loads(wf.conditions) if wf.conditions else []
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
                    WorkflowEngine._execute_action(db, action.action_type, json.loads(action.action_payload) if action.action_payload else {}, payload)
                
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
        if action_type in ("Create Enrollment", "Grant Course Access"):
            student_id = event_payload.get("student_id")
            course_id = event_payload.get("course_id")
            if student_id and course_id:
                student = db.query(Student).filter(Student.id == student_id).first()
                course = db.query(Course).filter(Course.id == course_id).first()
                if student and course and student not in course.students:
                    course.students.append(student)
        elif action_type == "Send Email":
            print(f"Mock Action: Sending Email to student_id {event_payload.get('student_id')} using template {action_payload.get('template')}")
        else:
            print(f"Workflow Action executed: {action_type}")

