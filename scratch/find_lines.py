with open("backend/app/routers/institute_admin.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

bad_words = [
    'UserRole', 'RolePermission', 'CourseEnrollment', 
    'CRMLead', 'CRMFollowup', 'NewsfeedLike', 'NewsfeedComment'
]

for idx, line in enumerate(lines, 1):
    for w in bad_words:
        if w in line:
            print(f"Line {idx}: {w} -> {line.strip()}")
