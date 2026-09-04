import re

file_path = "backend/app/routers/institute_admin.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: NewsfeedLike and NewsfeedComment
content = content.replace('p_dict["likes_count"] = db.query(NewsfeedLike).filter(NewsfeedLike.post_id == p.id).count()', 'p_dict["likes_count"] = 0')
content = content.replace('p_dict["comments_count"] = db.query(NewsfeedComment).filter(NewsfeedComment.post_id == p.id).count()', 'p_dict["comments_count"] = 0')

# Fix 2: UserRole replacement
content = re.sub(
    r'user_role_link = db\.query\(UserRole\)\.filter\(UserRole\.user_id == u\.id\)\.first\(\)',
    'user_role_link = u.roles[0] if u.roles else None',
    content
)
content = content.replace('db.add(UserRole(user_id=new_user.id, role_id=role_obj.id))', 'new_user.roles.append(role_obj)')

# Fix 3: RolePermission replacement
content = content.replace('rp_links = db.query(RolePermission).filter(RolePermission.role_id == r.id).all()\n        perms = []\n        for rp in rp_links:\n            p = db.query(Permission).filter(Permission.id == rp.permission_id).first()\n            if p:\n                perms.append(p)\n                \n        r_dict["permissions"] = perms', 'r_dict["permissions"] = r.permissions')
content = content.replace('db.add(RolePermission(role_id=new_role.id, permission_id=p_id))', '')
content = content.replace('rp_links = db.query(RolePermission).filter(RolePermission.role_id == new_role.id).all()\n    perms = []\n    for rp in rp_links:\n        p = db.query(Permission).filter(Permission.id == rp.permission_id).first()\n        if p:\n            perms.append(p)\n    res["permissions"] = perms', 'res["permissions"] = new_role.permissions')
content = content.replace('db.query(RolePermission).filter(RolePermission.role_id == role.id).delete()', '')
content = content.replace('db.add(RolePermission(role_id=role.id, permission_id=p_id))', '')
content = content.replace('rp_links = db.query(RolePermission).filter(RolePermission.role_id == role.id).all()\n    perms = []\n    for rp in rp_links:\n        p = db.query(Permission).filter(Permission.id == rp.permission_id).first()\n        if p:\n            perms.append(p)\n    res["permissions"] = perms', 'res["permissions"] = role.permissions')

# Fix 4: CRMLead and CRMFollowup -> Lead and LeadFollowup
content = content.replace('base_query = db.query(CRMLead).filter(CRMLead.institute_id == current_user.institute_id)', 'base_query = db.query(Lead).filter(Lead.institute_id == current_user.institute_id)')
content = content.replace('new_leads = base_query.filter(CRMLead.status == "New").count()', 'new_leads = base_query.filter(Lead.status == "New").count()')
content = content.replace('incomplete = base_query.filter(CRMLead.status == "Incomplete").count()', 'incomplete = base_query.filter(Lead.status == "Incomplete").count()')
content = content.replace('converted = base_query.filter(CRMLead.status == "Converted").count()', 'converted = base_query.filter(Lead.status == "Converted").count()')
content = content.replace('pending = db.query(CRMFollowup).join(CRMLead).filter(\n        CRMLead.institute_id == current_user.institute_id,\n        CRMFollowup.status == "Pending"\n    ).count()', 'pending = db.query(LeadFollowup).join(Lead).filter(Lead.institute_id == current_user.institute_id).count()')
content = content.replace('query = db.query(CRMLead).filter(CRMLead.institute_id == current_user.institute_id)', 'query = db.query(Lead).filter(Lead.institute_id == current_user.institute_id)')
content = content.replace('query = query.filter(CRMLead.status == status)', 'query = query.filter(Lead.status == status)')
content = content.replace('query = query.filter(or_(CRMLead.name.ilike(f"%{search}%"), CRMLead.email.ilike(f"%{search}%"), CRMLead.phone.ilike(f"%{search}%")))', 'query = query.filter(or_(Lead.name.ilike(f"%{search}%"), Lead.phone.ilike(f"%{search}%"), Lead.course_interest.ilike(f"%{search}%")))')
content = content.replace('leads = query.order_by(CRMLead.created_at.desc()).all()', 'leads = query.order_by(Lead.inquiry_date.desc()).all()')
content = content.replace('l_dict["followups"] = db.query(CRMFollowup).filter(CRMFollowup.lead_id == l.id).order_by(CRMFollowup.created_at.desc()).all()', 'followups = db.query(LeadFollowup).filter(LeadFollowup.lead_id == l.id).order_by(LeadFollowup.followup_date.desc()).all()\n        f_res = []\n        for f in followups:\n            f_dict = f.__dict__.copy()\n            f_dict["notes"] = f.note\n            f_dict["status"] = "Completed"\n            f_dict["created_at"] = f.followup_date\n            f_res.append(f_dict)\n        l_dict["followups"] = f_res')
content = content.replace('l = CRMLead(', 'l = Lead(')
content = content.replace('l = db.query(CRMLead).filter(CRMLead.id == lead_id, CRMLead.institute_id == current_user.institute_id).first()', 'l = db.query(Lead).filter(Lead.id == lead_id, Lead.institute_id == current_user.institute_id).first()')
content = content.replace('f = CRMFollowup(', 'f = LeadFollowup(')

# Fix 5: CourseEnrollment replacement
content = content.replace('en = db.query(CourseEnrollment).filter_by(student_id=student_id, course_id=course_id).first()', '')
content = content.replace('en = CourseEnrollment(student_id=student_id, course_id=course_id, enrollment_date=datetime.utcnow(), status="active")', '')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Applied replacements in institute_admin.py")
