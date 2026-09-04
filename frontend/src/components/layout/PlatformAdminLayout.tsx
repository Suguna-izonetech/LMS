import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building,
  Users,
  Shield,
  BookOpen,
  Blocks,
  Sparkles,
  Settings,
  Bell,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';

export const PlatformAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const profileMenuItems = [
    {
      label: 'Platform Settings',
      onClick: () => navigate('/institute-admin/settings'),
      icon: <Settings className="h-4 w-4 text-slate-400" />
    },
    {
      label: 'Sign Out',
      onClick: handleLogout,
      icon: <LogOut className="h-4 w-4 text-rose-400" />
    }
  ];

  const sidebarLinks = [
    { name: 'Platform Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Institutes Directory', path: '/admin/institutes', icon: Building },
    { name: 'Platform Users', path: '/institute-admin/institute-manager/users', icon: Users },
    { name: 'Global Roles & RBAC', path: '/institute-admin/institute-manager/roles', icon: Shield },
    { name: 'Courses Oversight', path: '/institute-admin/courses', icon: BookOpen },
    { name: 'Integrations & API', path: '/institute-admin/integrations/email', icon: Blocks },
    { name: 'Explore Plans & Add-ons', path: '/institute-admin/explore-plans', icon: Sparkles },
    { name: 'System Preferences', path: '/institute-admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-900 bg-slate-950 transition-transform duration-300 lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-display text-base font-bold text-slate-100 shadow-sm shadow-indigo-900/30">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-100">
              KITE <span className="text-indigo-400">ADMIN</span>
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

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {sidebarLinks.map((item) => {
            const Icon = item.icon;
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
                    isActive || pathname === item.path
                      ? 'bg-indigo-600 text-slate-100 font-semibold shadow-sm shadow-indigo-900/20'
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

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
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
              <span>Platform Administration</span>
              <ChevronRight className="h-3 w-3 text-slate-650" />
              <span className="text-slate-200 capitalize font-bold">
                {pathname.split('/').pop()?.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="relative rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 focus-ring cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500" />
            </button>

            <div className="h-5 w-px bg-slate-900" />

            {user && (
              <Dropdown
                align="right"
                trigger={
                  <button className="flex items-center gap-2.5 text-left cursor-pointer focus-ring rounded-lg p-1 hover:bg-slate-900/60 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 border border-indigo-400 text-slate-100 font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:flex flex-col">
                      <span className="text-xs font-semibold text-slate-200 leading-tight">
                        {user.username}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Platform Admin
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

        <main className="flex-1 overflow-y-auto bg-slate-950 px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default PlatformAdminLayout;
