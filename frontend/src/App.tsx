import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { MockDbProvider } from './context/MockDbContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { TeacherLayout } from './components/layout/TeacherLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { PlatformAdminLayout } from './components/layout/PlatformAdminLayout';
import { LoadingState } from './components/ui/LoadingState';

import {
  ProtectedRoute,
  TeacherRouteGuard,
  InstituteAdminRouteGuard,
  PlatformAdminRouteGuard,
  StudentRouteGuard
} from './components/layout/ProtectedRoute';

// Public & Common Pages (Lazy Loaded)
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const InstituteAdminLogin = lazy(() => import('./pages/InstituteAdminLogin').then(m => ({ default: m.InstituteAdminLogin })));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const StudentLogin = lazy(() => import('./pages/student/StudentLogin').then(m => ({ default: m.StudentLogin })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));
const Unauthorized = lazy(() => import('./pages/Unauthorized').then(m => ({ default: m.Unauthorized })));

// Institute Admin Pages (Lazy Loaded)
const CoursesList = lazy(() => import('./pages/CoursesList').then(m => ({ default: m.CoursesList })));
const CourseForm = lazy(() => import('./pages/CourseForm').then(m => ({ default: m.CourseForm })));
const LiveClassesList = lazy(() => import('./pages/LiveClassesList').then(m => ({ default: m.LiveClassesList })));
const PrerecordedModulesList = lazy(() => import('./pages/PrerecordedModulesList').then(m => ({ default: m.PrerecordedModulesList })));
const ModuleForm = lazy(() => import('./pages/ModuleForm').then(m => ({ default: m.ModuleForm })));
const BooksList = lazy(() => import('./pages/BooksList').then(m => ({ default: m.BooksList })));
const StudyMaterialsList = lazy(() => import('./pages/StudyMaterials').then(m => ({ default: m.StudyMaterialsList })));
const TasksList = lazy(() => import('./pages/TasksList').then(m => ({ default: m.TasksList })));
const WebinarsList = lazy(() => import('./pages/WebinarsList').then(m => ({ default: m.WebinarsList })));
const ConsultationsList = lazy(() => import('./pages/ConsultationsList').then(m => ({ default: m.ConsultationsList })));
const ManageUsers = lazy(() => import('./pages/ManageUsers').then(m => ({ default: m.ManageUsers })));
const InstituteProfile = lazy(() => import('./pages/InstituteProfile').then(m => ({ default: m.InstituteProfile })));
const ManageRoles = lazy(() => import('./pages/ManageRoles').then(m => ({ default: m.ManageRoles })));
const NotificationsList = lazy(() => import('./pages/NotificationsList').then(m => ({ default: m.NotificationsList })));
const TransactionsList = lazy(() => import('./pages/TransactionsList').then(m => ({ default: m.TransactionsList })));
const CertificatesList = lazy(() => import('./pages/CertificatesList').then(m => ({ default: m.CertificatesList })));
const NewsfeedList = lazy(() => import('./pages/NewsfeedList').then(m => ({ default: m.NewsfeedList })));
const ChatList = lazy(() => import('./pages/ChatList').then(m => ({ default: m.ChatList })));
const CRMList = lazy(() => import('./pages/CRMList').then(m => ({ default: m.CRMList })));
const Newsfeed = lazy(() => import('./pages/Newsfeed').then(m => ({ default: m.Newsfeed })));
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));
const CrmLeads = lazy(() => import('./pages/CrmLeads').then(m => ({ default: m.CrmLeads })));
const UserForm = lazy(() => import('./pages/UserForm'));
const QuizList = lazy(() => import('./pages/QuizList').then(m => ({ default: m.QuizList })));
const Integrations = lazy(() => import('./pages/Integrations').then(m => ({ default: m.Integrations })));
const BillingAndInvoicing = lazy(() => import('./pages/BillingAndInvoicing').then(m => ({ default: m.BillingAndInvoicing })));
const WorkflowsList = lazy(() => import('./pages/WorkflowsList').then(m => ({ default: m.WorkflowsList })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const ExplorePlans = lazy(() => import('./pages/ExplorePlans').then(m => ({ default: m.ExplorePlans })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

// Teacher Module Pages (Lazy Loaded)
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard').then(m => ({ default: m.Dashboard })));
const TeacherCourses = lazy(() => import('./pages/teacher/Courses').then(m => ({ default: m.Courses })));
const TeacherLiveClasses = lazy(() => import('./pages/teacher/learning-manager/LiveClasses').then(m => ({ default: m.LiveClasses })));
const TeacherBooks = lazy(() => import('./pages/teacher/learning-manager/Books').then(m => ({ default: m.Books })));
const TeacherMaterials = lazy(() => import('./pages/teacher/learning-manager/Materials').then(m => ({ default: m.Materials })));
const TeacherQuizzes = lazy(() => import('./pages/teacher/learning-manager/Quizzes').then(m => ({ default: m.Quizzes })));
const TeacherTasks = lazy(() => import('./pages/teacher/learning-manager/Tasks').then(m => ({ default: m.Tasks })));
const TeacherWebinars = lazy(() => import('./pages/teacher/learning-manager/Webinars').then(m => ({ default: m.Webinars })));
const TeacherAttendance = lazy(() => import('./pages/teacher/Attendance').then(m => ({ default: m.Attendance })));
const TeacherLeads = lazy(() => import('./pages/teacher/Leads').then(m => ({ default: m.Leads })));
const TeacherStudents = lazy(() => import('./pages/teacher/Students').then(m => ({ default: m.Students })));
const TeacherNewsfeed = lazy(() => import('./pages/teacher/Newsfeed').then(m => ({ default: m.Newsfeed })));
const TeacherChat = lazy(() => import('./pages/teacher/Chat').then(m => ({ default: m.Chat })));
const TeacherNotifications = lazy(() => import('./pages/teacher/Notifications').then(m => ({ default: m.Notifications })));
const TeacherReports = lazy(() => import('./pages/teacher/Reports').then(m => ({ default: m.Reports })));
const TeacherSettings = lazy(() => import('./pages/teacher/Settings').then(m => ({ default: m.Settings })));

// Student Pages (Lazy Loaded)
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentMyCourses = lazy(() => import('./pages/student/MyCourses'));
const StudentLiveClasses = lazy(() => import('./pages/student/LiveClasses'));
const StudentStudyMaterials = lazy(() => import('./pages/student/StudyMaterials'));
const StudentQuizzes = lazy(() => import('./pages/student/Quizzes'));
const StudentTasks = lazy(() => import('./pages/student/Tasks'));
const StudentCertificates = lazy(() => import('./pages/student/Certificates'));
const StudentSettings = lazy(() => import('./pages/student/Settings'));

// Platform Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminInstitutesList = lazy(() => import('./pages/admin/InstitutesList'));
const AdminUsersList = lazy(() => import('./pages/admin/UsersList'));

function App() {
  return (
    <AppProvider>
      <MockDbProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
                  <LoadingState message="Loading module..." />
                </div>
              }>
                <Routes>
                  {/* Dedicated Public Authentication Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/institute-admin/login" element={<InstituteAdminLogin />} />
                  <Route path="/teacher/login" element={<Login />} />
                  <Route path="/student/login" element={<StudentLogin />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* 1. Protected Student Portal Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<StudentRouteGuard />}>
                      <Route element={<StudentLayout />}>
                        <Route path="/student/dashboard" element={<StudentDashboard />} />
                        <Route path="/student/courses" element={<StudentMyCourses />} />
                        <Route path="/student/learning/live-classes" element={<StudentLiveClasses />} />
                        <Route path="/student/learning/materials" element={<StudentStudyMaterials />} />
                        <Route path="/student/assessments/quizzes" element={<StudentQuizzes />} />
                        <Route path="/student/assessments/tasks" element={<StudentTasks />} />
                        <Route path="/student/certificates" element={<StudentCertificates />} />
                        <Route path="/student/newsfeed" element={<TeacherNewsfeed />} />
                        <Route path="/student/chat" element={<TeacherChat />} />
                        <Route path="/student/settings" element={<StudentSettings />} />
                      </Route>
                    </Route>
                  </Route>

                  {/* 2. Protected Teacher Dashboard Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<TeacherRouteGuard />}>
                      <Route element={<TeacherLayout />}>
                        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                        <Route path="/teacher/courses" element={<TeacherCourses />} />
                        <Route path="/teacher/learning-manager/live-classes" element={<TeacherLiveClasses />} />
                        <Route path="/teacher/learning-manager/books" element={<TeacherBooks />} />
                        <Route path="/teacher/learning-manager/materials" element={<TeacherMaterials />} />
                        <Route path="/teacher/learning-manager/quizzes" element={<TeacherQuizzes />} />
                        <Route path="/teacher/learning-manager/tasks" element={<TeacherTasks />} />
                        <Route path="/teacher/learning-manager/webinars" element={<TeacherWebinars />} />
                        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
                        <Route path="/teacher/leads" element={<TeacherLeads />} />
                        <Route path="/teacher/students" element={<TeacherStudents />} />
                        <Route path="/teacher/newsfeed" element={<TeacherNewsfeed />} />
                        <Route path="/teacher/chat" element={<TeacherChat />} />
                        <Route path="/teacher/notifications" element={<TeacherNotifications />} />
                        <Route path="/teacher/reports" element={<TeacherReports />} />
                        <Route path="/teacher/settings" element={<TeacherSettings />} />
                      </Route>
                    </Route>
                  </Route>

                  {/* 3. Protected Institute Administrator Shell Layout */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<InstituteAdminRouteGuard />}>
                      <Route path="/institute-admin" element={<AdminLayout />}>
                        <Route index element={<Navigate to="/institute-admin/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />

                        {/* Course Builder Module */}
                        <Route path="courses" element={<CoursesList />} />
                        <Route path="courses/create" element={<CourseForm mode="create" />} />
                        <Route path="courses/:courseId/edit" element={<CourseForm mode="edit" />} />

                        {/* Learning Manager Modules */}
                        <Route path="learning-manager/live-classes" element={<LiveClassesList />} />
                        <Route path="learning-manager/live-classes/:id" element={<PlaceholderPage />} />
                        <Route path="learning-manager/prerecorded-modules" element={<PrerecordedModulesList />} />
                        <Route path="learning-manager/prerecorded-modules/create" element={<ModuleForm />} />
                        <Route path="learning-manager/prerecorded-modules/:id" element={<ModuleForm />} />
                        <Route path="learning-manager/books" element={<BooksList />} />
                        <Route path="learning-manager/study-materials" element={<StudyMaterialsList />} />
                        <Route path="learning-manager/study-materials/:category" element={<PlaceholderPage />} />
                        <Route path="learning-manager/quiz" element={<QuizList />} />
                        <Route path="learning-manager/quiz/:id" element={<PlaceholderPage />} />
                        <Route path="learning-manager/tasks" element={<TasksList />} />
                        <Route path="learning-manager/webinars" element={<WebinarsList />} />
                        <Route path="learning-manager/webinars/:id" element={<PlaceholderPage />} />
                        <Route path="learning-manager/consultations" element={<ConsultationsList />} />
                        <Route path="learning-manager/consultations/:id" element={<PlaceholderPage />} />

                        {/* Institute Manager Modules */}
                        <Route path="institute-manager/consultations" element={<ConsultationsList />} />
                        <Route path="institute-manager/users" element={<ManageUsers />} />
                        <Route path="institute-manager/users/create" element={<UserForm />} />
                        <Route path="institute-manager/users/bulk-upload" element={<PlaceholderPage />} />
                        <Route path="institute-profile" element={<InstituteProfile />} />
                        <Route path="institute-manager/roles" element={<ManageRoles />} />
                        <Route path="institute-manager/notifications" element={<NotificationsList />} />
                        <Route path="institute-manager/transactions" element={<TransactionsList />} />
                        <Route path="institute-manager/certificates" element={<CertificatesList />} />
                        <Route path="institute-manager/social/newsfeed" element={<NewsfeedList />} />
                        <Route path="institute-manager/social/chat" element={<ChatList />} />
                        <Route path="institute-manager/crm" element={<CRMList />} />
                        <Route path="institute-manager/integrations" element={<Integrations />} />
                        <Route path="institute-manager/integrations/:tab" element={<Integrations />} />
                        <Route path="institute-manager/billing" element={<BillingAndInvoicing />} />
                        <Route path="institute-manager/workflows" element={<WorkflowsList />} />
                        <Route path="institute-manager/reports" element={<Reports />} />
                        <Route path="institute-manager/explore-plans" element={<ExplorePlans />} />
                        <Route path="institute-manager/roles/:id/permissions" element={<PlaceholderPage />} />
                        <Route path="institute-manager/achievers" element={<PlaceholderPage />} />
                        <Route path="institute-manager/blogs" element={<PlaceholderPage />} />
                        <Route path="institute-manager/blogs/:id" element={<PlaceholderPage />} />
                        <Route path="institute-manager/blogs-management" element={<PlaceholderPage />} />
                        <Route path="institute-manager/on-domain-settings" element={<PlaceholderPage />} />
                        <Route path="institute-manager/on-domain-settings/tracking-integrations" element={<PlaceholderPage />} />
                        <Route path="institute-manager/on-domain-settings/appearance" element={<PlaceholderPage />} />
                        <Route path="institute-manager/on-domain-settings/domain-settings" element={<PlaceholderPage />} />
                        <Route path="institute-manager/on-domain-settings/wordpress-integration" element={<PlaceholderPage />} />
                        <Route path="institute-manager/on-domain-settings/whatsapp-button" element={<PlaceholderPage />} />
                        <Route path="institute-manager/coupons" element={<PlaceholderPage />} />

                        {/* Social Connect Modules */}
                        <Route path="social-connect/newsfeed" element={<Newsfeed />} />
                        <Route path="social-connect/chat" element={<Chat />} />
                        <Route path="social-connect/chat/:conversationId" element={<Chat />} />

                        {/* Customer Relationship Management */}
                        <Route path="crm" element={<CRMList />} />
                        <Route path="crm/leads" element={<CrmLeads />} />
                        <Route path="crm/leads/:id" element={<CrmLeads />} />

                        {/* Third-Party Integrations */}
                        <Route path="integrations" element={<Integrations />} />
                        <Route path="integrations/:tab" element={<Integrations />} />
                        <Route path="integrations/communication" element={<Integrations defaultTab="communication" />} />
                        <Route path="integrations/payments" element={<Integrations defaultTab="payments" />} />
                        <Route path="integrations/billing" element={<Integrations defaultTab="billing" />} />

                        {/* Core Automation & Operations */}
                        <Route path="workflows" element={<WorkflowsList />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="explore-plans" element={<ExplorePlans />} />

                        {/* System Preferences & Settings */}
                        <Route path="settings" element={<Settings />} />
                        <Route path="settings/:tab" element={<Settings />} />
                        <Route path="settings/login" element={<Settings defaultTab="login" />} />
                        <Route path="settings/class" element={<Settings defaultTab="class" />} />
                        <Route path="settings/content-download" element={<Settings defaultTab="content-download" />} />
                        <Route path="settings/billing" element={<Settings defaultTab="billing" />} />
                        <Route path="settings/chat-social" element={<Settings defaultTab="chat-social" />} />
                        <Route path="settings/security" element={<Settings defaultTab="security" />} />
                      </Route>
                    </Route>
                  </Route>

                  {/* 4. Protected Platform Admin Shell Layout */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<PlatformAdminRouteGuard />}>
                      <Route element={<PlatformAdminLayout />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/institutes" element={<AdminInstitutesList />} />
                        <Route path="/admin/users" element={<AdminUsersList />} />
                        <Route path="/admin/roles" element={<ManageRoles />} />
                        <Route path="/admin/courses" element={<CoursesList />} />
                        <Route path="/admin/integrations" element={<Integrations />} />
                        <Route path="/admin/plans" element={<ExplorePlans />} />
                        <Route path="/admin/settings" element={<Settings />} />
                      </Route>
                    </Route>
                  </Route>

                  {/* Fallback Redirection */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </MockDbProvider>
    </AppProvider>
  );
}

export default App;
