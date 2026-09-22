import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  CheckSquare,
  Award,
  Share2,
  MessageSquare,
  Settings,
  Bell,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { NotificationDropdown } from './NotificationDropdown';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [learningExpanded, setLearningExpanded] = useState(
    pathname.includes('/student/learning')
  );
  const [assessmentsExpanded, setAssessmentsExpanded] = useState(
    pathname.includes('/student/assessments')
  );

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleLogout = async () => {
    await logout();
    navigate('/student/login');
  };

  const profileMenuItems = [
    {
      label: 'My Account Settings',
      onClick: () => navigate('/student/settings'),
      icon: <Settings className="h-4 w-4 text-slate-400" />
    },
    {
      label: 'Sign Out',
      onClick: handleLogout,
      icon: <LogOut className="h-4 w-4 text-rose-400" />
    }
  ];

  const sidebarLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/student/courses', icon: BookOpen },
    {
      name: 'Learning Manager',
      icon: GraduationCap,
      isExpanded: learningExpanded,
      onToggle: () => setLearningExpanded(prev => !prev),
      subItems: [
        { name: 'Live Classes', path: '/student/learning/live-classes', icon: Video },
        { name: 'Study Materials & Books', path: '/student/learning/materials', icon: FileText },
      ]
    },
    {
      name: 'Assessments',
      icon: CheckSquare,
      isExpanded: assessmentsExpanded,
      onToggle: () => setAssessmentsExpanded(prev => !prev),
      subItems: [
        { name: 'Quizzes', path: '/student/assessments/quizzes', icon: HelpCircle },
        { name: 'Tasks & Assignments', path: '/student/assessments/tasks', icon: CheckSquare },
        { name: 'Main Exams', path: '/student/assessments/main-exams', icon: Award },
      ]
    },
    { name: 'My Certificates', path: '/student/certificates', icon: Award },
    { name: 'News', path: '/student/newsfeed', icon: Share2 },
    { name: 'Feedback', path: '/student/feedback', icon: MessageSquare },
    { name: 'Settings', path: '/student/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-900 bg-slate-950 transition-transform duration-300 lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 font-display text-base font-bold text-slate-100 shadow-sm shadow-sky-900/30">
              S
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-100">
              KITE <span className="text-sky-400">STUDENT</span>
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-200 lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {sidebarLinks.map((item) => {
            const Icon = item.icon;
            
            if (item.subItems) {
              const isSubActive = item.subItems.some(sub => pathname === sub.path);
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={item.onToggle}
                    className={`
                      w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer
                      ${
                        isSubActive
                          ? 'text-sky-400 bg-sky-950/30'
                          : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {item.isExpanded && (
                    <div className="pl-4 ml-5 my-1 border-l border-slate-900 space-y-1">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.name}
                          to={subItem.path}
                          onClick={() => {
                            if (window.innerWidth < 1024) toggleSidebar();
                          }}
                          className={({ isActive }) => `
                            relative block rounded-md pl-3 pr-2 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-150 hover:pl-4
                            ${
                              isActive
                                ? 'text-sky-400 bg-sky-950/30 font-bold'
                                : 'text-slate-500 hover:text-slate-300'
                            }
                          `}
                        >
                          {pathname === subItem.path && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3 rounded-full bg-sky-500 shadow-sm shadow-sky-500/55" />
                          )}
                          {subItem.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
                  ${
                    isActive
                      ? 'bg-sky-600 text-slate-100 font-semibold shadow-sm shadow-sky-900/20'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                  }
                `}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-300 lg:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-sm text-slate-400 font-medium select-none">
              <span>Student Portal</span>
              <ChevronRight className="h-3 w-3 text-slate-650" />
              <span className="text-slate-200 capitalize font-bold">
                {pathname.split('/').pop()?.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown colorScheme="sky" role="student" />

            <div className="h-5 w-px bg-slate-900" />

            {/* Profile Dropdown */}
            {user && (
              <Dropdown
                align="right"
                trigger={
                  <button className="flex items-center gap-2.5 text-left cursor-pointer focus-ring rounded-lg p-1 hover:bg-slate-900/60 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 border border-sky-400 text-slate-100 font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:flex flex-col">
                      <span className="text-xs font-semibold text-slate-200 leading-tight">
                        {user.username}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Student Account
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  </button>
                }
                items={profileMenuItems}
              />
            )}
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-950 px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default StudentLayout;
