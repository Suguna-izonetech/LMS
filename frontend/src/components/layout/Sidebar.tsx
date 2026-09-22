import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Building2,
  Share2,
  Users,
  Blocks,
  GitFork,
  BarChart3,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCircle
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path?: string;
  icon: React.ComponentType<any>;
  subItems?: { name: string; path: string }[];
}

export const Sidebar: React.FC<{ isOpen: boolean; toggleSidebar: () => void }> = ({
  isOpen,
  toggleSidebar,
}) => {
  const { pathname } = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Learning Manager': pathname.includes('/learning-manager'),
    'Institute Manager': pathname.includes('/institute-manager'),
    'Social Connect': pathname.includes('/social-connect'),
    'Integrations': pathname.includes('/integrations'),
  });

  const toggleSubMenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/institute-admin/dashboard', icon: LayoutDashboard },
    { name: 'Courses', path: '/institute-admin/courses', icon: BookOpen },
    {
      name: 'Learning Manager',
      icon: GraduationCap,
      subItems: [
        { name: 'Prerecorded Modules', path: '/institute-admin/learning-manager/prerecorded-modules' },
        { name: 'Manage Books', path: '/institute-admin/learning-manager/books' },
        { name: 'Manage Exams', path: '/institute-admin/learning-manager/quiz' },
        { name: 'Webinars', path: '/institute-admin/learning-manager/webinars' },
      ],
    },
    {
      name: 'Institute Manager',
      icon: Building2,
      subItems: [
        { name: 'Manage Users', path: '/institute-admin/institute-manager/users' },
        { name: 'Manage Roles', path: '/institute-admin/institute-manager/roles' },
        { name: 'Notifications', path: '/institute-admin/institute-manager/notifications' },
        { name: 'Transactions', path: '/institute-admin/institute-manager/transactions' },
        { name: 'Certificates', path: '/institute-admin/institute-manager/certificates' },
      ],
    },
    {
      name: 'Social Connect',
      icon: Share2,
      subItems: [
        { name: 'Newsfeed', path: '/institute-admin/social-connect/newsfeed' },
      ],
    },
    { name: 'CRM', path: '/institute-admin/crm', icon: Users },
    {
      name: 'Integrations',
      icon: Blocks,
      subItems: [
        { name: 'Email', path: '/institute-admin/integrations/email' },
        { name: 'WhatsApp', path: '/institute-admin/integrations/whatsapp' },
        { name: 'Razorpay', path: '/institute-admin/integrations/razorpay' },
        { name: 'PayPal', path: '/institute-admin/integrations/paypal' },
        { name: 'GST / Invoicing', path: '/institute-admin/integrations/invoicing' },
      ],
    },
    { name: 'WorkFlows', path: '/institute-admin/workflows', icon: GitFork },
    { name: 'Reports', path: '/institute-admin/reports', icon: BarChart3 },
    { name: 'Explore Plans', path: '/institute-admin/explore-plans', icon: Sparkles },
    { name: 'Profile / Settings', path: '/institute-admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay backdrop when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-900 bg-slate-950 transition-transform duration-300 lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-display text-base font-bold text-slate-100 shadow-sm shadow-emerald-900/30">
              iZ
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-100">
              iZone <span className="text-emerald-500">LMS</span>
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-350 lg:hidden"
            aria-label="Close sidebar"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isMenuExpanded = expandedMenus[item.name];
            
            // Highlight parent if any sub-item is active
            const isParentActive = hasSubItems && item.subItems?.some(sub => pathname === sub.path);

            if (hasSubItems) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleSubMenu(item.name)}
                    className={`
                      w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer
                      ${
                        isParentActive
                          ? 'text-emerald-400 bg-emerald-950/20'
                          : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {isMenuExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isMenuExpanded && (
                    <div className="pl-4 ml-5 my-1 border-l border-slate-900 space-y-1">
                      {item.subItems?.map((subItem) => (
                        <NavLink
                          key={subItem.name}
                          to={subItem.path}
                          onClick={() => {
                            if (window.innerWidth < 1024) toggleSidebar();
                          }}
                          className={({ isActive }) => `
                            relative block rounded-md pl-3 pr-2 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-150 hover:pl-4
                            ${
                              isActive || pathname === subItem.path
                                ? 'text-emerald-400 bg-emerald-950/20 font-bold'
                                : 'text-slate-500 hover:text-slate-300'
                            }
                          `}
                        >
                          {pathname === subItem.path && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/55" />
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
                to={item.path || '#'}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
                  ${
                    isActive || pathname === item.path
                      ? 'bg-emerald-600 text-slate-100 font-semibold shadow-sm shadow-emerald-900/10'
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
    </>
  );
};
