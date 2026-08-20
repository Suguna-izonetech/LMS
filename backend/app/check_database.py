from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.models.team import Team
from app.models.call import Call

db: Session = SessionLocal()

print("\n" + "="*60)
print("DATABASE STATUS CHECK")
print("="*60)

# Check Teams
teams = db.query(Team).all()
print(f"\n📋 TEAMS ({len(teams)}):")
if teams:
    for team in teams:
        print(f"  - ID: {team.id}, Name: {team.name}")
else:
    print("  ⚠️ No teams found")

# Check Employees
employees = db.query(User).filter(User.role == UserRole.EMPLOYEE).all()
print(f"\n👥 EMPLOYEES ({len(employees)}):")
if employees:
    for emp in employees:
        team_name = "No Team"
        if emp.team_id:
            team = db.query(Team).filter(Team.id == emp.team_id).first()
            if team:
                team_name = team.name
        print(f"  - ID: {emp.id}, Name: {emp.name}, Email: {emp.email}, Team: {team_name}")
else:
    print("  ⚠️ No employees found")

# Check Managers
managers = db.query(User).filter(User.role == UserRole.MANAGER).all()
print(f"\n👔 MANAGERS ({len(managers)}):")
if managers:
    for mgr in managers:
        print(f"  - ID: {mgr.id}, Name: {mgr.name}, Email: {mgr.email}")
else:
    print("  ⚠️ No managers found")

# Check Tasks/Calls
calls = db.query(Call).all()
print(f"\n📞 TASKS/CALLS ({len(calls)}):")
if calls:
    assigned = len([c for c in calls if c.assigned_to_id or c.team_id])
    unassigned = len(calls) - assigned
    print(f"  - Total: {len(calls)}")
    print(f"  - Assigned: {assigned}")
    print(f"  - Unassigned: {unassigned}")
    
    print(f"\n  Recent tasks:")
    for call in calls[:5]:
        assigned_to = "Unassigned"
        if call.assigned_to_id:
            emp = db.query(User).filter(User.id == call.assigned_to_id).first()
            if emp:
                assigned_to = emp.name
        team_name = "No Team"
        if call.team_id:
            team = db.query(Team).filter(Team.id == call.team_id).first()
            if team:
                team_name = team.name
        print(f"    - {call.customer_name} ({call.phone}) -> {assigned_to} | Team: {team_name}")
else:
    print("  ⚠️ No tasks found")

print("\n" + "="*60)

db.close()
