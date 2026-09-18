import React from 'react';
import { Menu, User, ChevronDown, LogOut, Settings } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User as UserType } from '../../context/AuthContext';

export interface TopbarProps {
  toggleSidebar: () => void;
  user: UserType | null;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  toggleSidebar,
  user,
  onLogout,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  // Basic breadcrumb / title generator based on route
  const getPageTitle = () => {
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length <= 1) return 'Dashboard';
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const title = getPageTitle();

  const profileMenuItems = [
    { label: 'Profile Settings', onClick: () => navigate('/institute-admin/settings'), icon: <Settings className="h-4 w-4 text-slate-400" /> },
    { label: 'Sign Out', onClick: onLogout, icon: <LogOut className="h-4 w-4 text-rose-400" /> }
  ];

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 z-35 sticky top-0">
      <div className="flex items-center gap-4">
        {/* Toggle sidebar button for mobile */}
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-300 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page Title / Breadcrumb */}
        <div className="flex items-center gap-2">
           <span className="text-sm font-semibold text-slate-400 hidden sm:inline-block">Institute Admin</span>
           <span className="text-slate-600 hidden sm:inline-block">/</span>
           <h1 className="text-lg font-bold text-slate-100">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <NotificationDropdown colorScheme="emerald" role="institute_admin" />

        <div className="h-5 w-px bg-slate-900" />

        {/* User profile dropdown */}
        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2 hover:bg-slate-900/50 p-1 pr-2 rounded-lg transition-colors cursor-pointer text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-200">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                  {user?.username || 'Admin User'}
                </span>
                <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
                  {user?.email || 'admin@kite.lms'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
            </button>
          }
          items={profileMenuItems}
        />
      </div>
    </header>
  );
};
export default Topbar;
