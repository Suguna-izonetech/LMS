import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { MockDbProvider } from './context/MockDbContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { TeacherLayout } from './components/layout/TeacherLayout';
import { ProtectedRoute, TeacherRouteGuard, InstituteAdminRouteGuard } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { InstituteAdminLogin } from './pages/InstituteAdminLogin';
import { Dashboard } from './pages/Dashboard';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { Unauthorized } from './pages/Unauthorized';

// Component imports for the KITE LMS Dashboard routing (Admin)
import { CoursesList } from './pages/CoursesList';
import { CourseForm } from './pages/CourseForm';
import { LiveClassesList } from './pages/LiveClassesList';
import { PrerecordedModulesList } from './pages/PrerecordedModulesList';
import { ModuleForm } from './pages/ModuleForm';
import { BooksList } from './pages/BooksList';
import { StudyMaterialsList } from './pages/StudyMaterials';
import { TasksList } from './pages/TasksList';
import { WebinarsList } from './pages/WebinarsList';
import { ConsultationsList } from './pages/ConsultationsList';
import { ManageUsers } from './pages/ManageUsers';
import { InstituteProfile } from './pages/InstituteProfile';
import { ManageRoles } from './pages/ManageRoles';
import { NotificationsList } from './pages/NotificationsList';
import { TransactionsList } from './pages/TransactionsList';
import { CertificatesList } from './pages/CertificatesList';
import { NewsfeedList } from './pages/NewsfeedList';
import { ChatList } from './pages/ChatList';
import { CRMList } from './pages/CRMList';
import { Newsfeed } from './pages/Newsfeed';
import { Chat } from './pages/Chat';
import { CrmLeads } from './pages/CrmLeads';
import UserForm from './pages/UserForm';
import { QuizList } from './pages/QuizList';
import { Integrations } from './pages/Integrations';
import { BillingAndInvoicing } from './pages/BillingAndInvoicing';
import { WorkflowsList } from './pages/WorkflowsList';
import { Workflows } from './pages/Workflows';
import { Reports } from './pages/Reports';
import { ExplorePlans } from './pages/ExplorePlans';
import { Settings } from './pages/Settings';

// Teacher-specific Module Imports
import { Dashboard as TeacherDashboard } from './pages/teacher/Dashboard';
import { Courses as TeacherCourses } from './pages/teacher/Courses';
import { LiveClasses as TeacherLiveClasses } from './pages/teacher/learning-manager/LiveClasses';
import { Books as TeacherBooks } from './pages/teacher/learning-manager/Books';
import { Materials as TeacherMaterials } from './pages/teacher/learning-manager/Materials';
import { Quizzes as TeacherQuizzes } from './pages/teacher/learning-manager/Quizzes';
import { Tasks as TeacherTasks } from './pages/teacher/learning-manager/Tasks';
import { Webinars as TeacherWebinars } from './pages/teacher/learning-manager/Webinars';
import { Attendance as TeacherAttendance } from './pages/teacher/Attendance';
import { Leads as TeacherLeads } from './pages/teacher/Leads';
import { Students as TeacherStudents } from './pages/teacher/Students';
import { Newsfeed as TeacherNewsfeed } from './pages/teacher/Newsfeed';
import { Chat as TeacherChat } from './pages/teacher/Chat';
import { Notifications as TeacherNotifications } from './pages/teacher/Notifications';
import { Reports as TeacherReports } from './pages/teacher/Reports';
import { Settings as TeacherSettings } from './pages/teacher/Settings';

function App() {
  return (
    <AppProvider>
      <MockDbProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <Routes>
                {/* Public Authentication Route */}
                <Route path="/login" element={<Login />} />
                <Route path="/institute-admin/login" element={<InstituteAdminLogin />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Protected Teacher Dashboard Routes */}
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
                
                {/* Gated Administrator Shell Layout (Legacy/Admin) */}
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
                      <Route path="learning-manager/consultations" element={<PlaceholderPage />} />
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
                      <Route path="crm" element={<CrmLeads />} />
                      <Route path="crm/leads" element={<CrmLeads />} />
                      <Route path="crm/leads/:id" element={<CrmLeads />} />

                      {/* Third-Party Integrations */}
                      <Route path="integrations/communication" element={<Integrations defaultTab="communication" />} />
                      <Route path="integrations/payments" element={<Integrations defaultTab="payments" />} />
                      <Route path="integrations/billing" element={<Integrations defaultTab="billing" />} />

                      {/* Core Automation & Operations */}
                      <Route path="workflows" element={<Workflows />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="explore-plans" element={<ExplorePlans />} />

                      {/* System Preferences & Settings */}
                      <Route path="settings/login" element={<Settings defaultTab="login" />} />
                      <Route path="settings/class" element={<Settings defaultTab="class" />} />
                      <Route path="settings/content-download" element={<Settings defaultTab="content-download" />} />
                      <Route path="settings/billing" element={<Settings defaultTab="billing" />} />
                      <Route path="settings/chat-social" element={<Settings defaultTab="chat-social" />} />
                      <Route path="settings/security" element={<Settings defaultTab="security" />} />
                    </Route>
                  </Route>
                </Route>
                
                {/* Fallback Redirection */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </MockDbProvider>
    </AppProvider>
  );
}

export default App;
