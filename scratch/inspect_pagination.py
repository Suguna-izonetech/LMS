import os

files_to_check = [
    "frontend/src/pages/BillingAndInvoicing.tsx",
    "frontend/src/pages/BooksList.tsx",
    "frontend/src/pages/CertificatesList.tsx",
    "frontend/src/pages/ConsultationsList.tsx",
    "frontend/src/pages/CoursesList.tsx",
    "frontend/src/pages/CrmLeads.tsx",
    "frontend/src/pages/CRMList.tsx",
    "frontend/src/pages/LiveClassesList.tsx",
    "frontend/src/pages/ManageRoles.tsx",
    "frontend/src/pages/ManageUsers.tsx",
    "frontend/src/pages/NewsfeedList.tsx",
    "frontend/src/pages/NotificationsList.tsx",
    "frontend/src/pages/PrerecordedModulesList.tsx",
    "frontend/src/pages/QuizList.tsx",
    "frontend/src/pages/Reports.tsx",
    "frontend/src/pages/StudyMaterials.tsx",
    "frontend/src/pages/TasksList.tsx",
    "frontend/src/pages/TransactionsList.tsx",
    "frontend/src/pages/WebinarsList.tsx",
    "frontend/src/pages/WorkflowsList.tsx",
]

for filepath in files_to_check:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if there is an early return before usePagination
    # Find position of usePagination
    pos = content.find("usePagination(")
    if pos != -1:
        before = content[:pos]
        has_early_return = "return (" in before or "return <" in before or "return\n" in before
        has_iife = "{(() => {" in content
        print(f"{filepath}: Has early return before usePagination? {has_early_return}, Has IIFE? {has_iife}")
