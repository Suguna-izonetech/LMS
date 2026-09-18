import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  Building,
  DollarSign,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  Info,
  Sparkles,
  Clock,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type?: 'system' | 'billing' | 'security' | 'academic' | 'institute' | 'general';
  targetUrl?: string;
}

interface NotificationDropdownProps {
  colorScheme?: 'indigo' | 'emerald' | 'violet' | 'sky';
  role?: string;
  align?: 'right' | 'left';
}

const DEFAULT_NOTIFICATIONS: Record<string, NotificationItem[]> = {
  platform_admin: [
    {
      id: 'pa-1',
      title: 'New Institute Onboarded',
      message: 'Apex Academy was onboarded with Enterprise Pro subscription plan.',
      timestamp: '10 mins ago',
      isRead: false,
      type: 'institute',
      targetUrl: '/admin/institutes',
    },
    {
      id: 'pa-2',
      title: 'Payment Gateway Renewal',
      message: 'Razorpay Auto-Settlement processed successfully for ₹45,000.',
      timestamp: '45 mins ago',
      isRead: false,
      type: 'billing',
      targetUrl: '/admin/plans',
    },
    {
      id: 'pa-3',
      title: 'Global Add-on Activated',
      message: 'WhatsApp OTP Service is now active across 10 partner institutes.',
      timestamp: '2 hours ago',
      isRead: false,
      type: 'system',
      targetUrl: '/admin/integrations',
    },
    {
      id: 'pa-4',
      title: 'Security Audit Clearance',
      message: 'Quarterly RBAC & platform authentication audit finished with 0 vulnerabilities.',
      timestamp: '1 day ago',
      isRead: true,
      type: 'security',
      targetUrl: '/admin/roles',
    },
    {
      id: 'pa-5',
      title: 'Database Telemetry Notice',
      message: 'PostgreSQL clusters automated backup executed with 100% integrity check.',
      timestamp: '2 days ago',
      isRead: true,
      type: 'system',
      targetUrl: '/admin/dashboard',
    },
  ],
  institute_admin: [
    {
      id: 'ia-1',
      title: 'Batch Enrollment Spike',
      message: '24 new students enrolled in Full Stack Engineering Bootcamp.',
      timestamp: '15 mins ago',
      isRead: false,
      type: 'academic',
      targetUrl: '/institute-admin/institute-manager/users',
    },
    {
      id: 'ia-2',
      title: 'Upcoming Live Lecture',
      message: 'Advanced System Design live class starts in 45 minutes.',
      timestamp: '45 mins ago',
      isRead: false,
      type: 'academic',
      targetUrl: '/institute-admin/learning-manager/live-classes',
    },
    {
      id: 'ia-3',
      title: 'Pending Quiz Approvals',
      message: '8 quiz submissions require evaluation and grade confirmation.',
      timestamp: '3 hours ago',
      isRead: false,
      type: 'academic',
      targetUrl: '/institute-admin/learning-manager/quiz',
    },
    {
      id: 'ia-4',
      title: 'Subscription Invoice Generated',
      message: 'Monthly campus tier invoice #INV-2026-09 is ready for download.',
      timestamp: '1 day ago',
      isRead: true,
      type: 'billing',
      targetUrl: '/institute-admin/institute-manager/billing',
    },
  ],
  teacher: [
    {
      id: 't-1',
      title: 'Student Query Received',
      message: 'Rohan Sharma asked a doubt on "React Server Components Architecture".',
      timestamp: '12 mins ago',
      isRead: false,
      type: 'academic',
      targetUrl: '/teacher/chat',
    },
    {
      id: 't-2',
      title: 'Assignment Submissions Ready',
      message: '18 students submitted their Week 3 TypeScript assignments.',
      timestamp: '1 hour ago',
      isRead: false,
      type: 'academic',
      targetUrl: '/teacher/learning-manager/tasks',
    },
    {
      id: 't-3',
      title: 'Live Class Reminder',
      message: 'Data Structures Live Session begins at 4:00 PM today.',
      timestamp: '2 hours ago',
      isRead: true,
      type: 'academic',
      targetUrl: '/teacher/learning-manager/live-classes',
    },
  ],
  student: [
    {
      id: 's-1',
      title: 'New Assignment Assigned',
      message: 'Project Milestone 2: Microservices Backend due tomorrow at 11:59 PM.',
      timestamp: '25 mins ago',
      isRead: false,
      type: 'academic',
      targetUrl: '/student/dashboard',
    },
    {
      id: 's-2',
      title: 'Live Workshop Starting Soon',
      message: 'Interactive System Architecture workshop begins in 20 minutes.',
      timestamp: '20 mins ago',
      isRead: false,
      type: 'academic',
      targetUrl: '/student/dashboard',
    },
    {
      id: 's-3',
      title: 'Quiz Score Released',
      message: 'You scored 94% on Cloud Computing Foundations Quiz.',
      timestamp: '4 hours ago',
      isRead: true,
      type: 'academic',
      targetUrl: '/student/dashboard',
    },
  ],
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  colorScheme = 'indigo',
  role,
  align = 'right',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine active role
  const resolvedRole =
    role ||
    (user?.roles?.some((r) => r.name === 'Platform Admin' || r.name === 'Super Admin')
      ? 'platform_admin'
      : user?.roles?.some((r) => r.name === 'Institute Admin')
      ? 'institute_admin'
      : user?.roles?.some((r) => r.name === 'Teacher')
      ? 'teacher'
      : 'student');

  const storageKey = `kite_notifications_${resolvedRole}`;

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return DEFAULT_NOTIFICATIONS[resolvedRole] || DEFAULT_NOTIFICATIONS.platform_admin;
  });

  // Sync to local storage
  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    return true;
  });

  // Theme color accents
  const dotColorClass = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    sky: 'bg-sky-500',
  }[colorScheme];

  const activeTabClass = {
    indigo: 'text-indigo-400 border-indigo-500',
    emerald: 'text-emerald-400 border-emerald-500',
    violet: 'text-violet-400 border-violet-500',
    sky: 'text-sky-400 border-sky-500',
  }[colorScheme];

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'institute':
        return <Building className="h-4 w-4 text-indigo-400" />;
      case 'billing':
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'security':
        return <ShieldAlert className="h-4 w-4 text-amber-400" />;
      case 'academic':
        return <GraduationCap className="h-4 w-4 text-violet-400" />;
      case 'system':
        return <Sparkles className="h-4 w-4 text-sky-400" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 focus-ring cursor-pointer transition-colors ${
          isOpen ? 'bg-slate-900 text-slate-100' : ''
        }`}
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${dotColorClass} ring-2 ring-slate-950 animate-pulse`}
          />
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden focus:outline-hidden
            animate-in fade-in zoom-in-95 duration-150
            ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100">Notifications</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[11px] font-bold text-indigo-300">
                  {unreadCount} new
                </span>
              ) : (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                  Caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-indigo-400 p-1 rounded-md transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          {notifications.length > 0 && (
            <div className="flex border-b border-slate-800/60 bg-slate-900/30 px-4 text-xs font-medium">
              <button
                onClick={() => setActiveFilter('all')}
                className={`py-2 px-2 border-b-2 font-medium transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? activeTabClass
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`py-2 px-2 border-b-2 font-medium transition-colors cursor-pointer ${
                  activeFilter === 'unread'
                    ? activeTabClass
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          )}

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-3">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {activeFilter === 'unread'
                    ? 'All alerts and system messages have been marked as read.'
                    : 'You are completely caught up! New system activity will appear here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative flex items-start gap-3.5 p-3.5 text-left transition-all cursor-pointer ${
                    item.isRead
                      ? 'bg-slate-950/40 hover:bg-slate-900/60'
                      : 'bg-indigo-950/15 hover:bg-indigo-950/25'
                  }`}
                >
                  {/* Icon Avatar */}
                  <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
                    {getIconForType(item.type)}
                    {!item.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          item.isRead ? 'text-slate-300' : 'text-slate-100 font-bold'
                        }`}
                      >
                        {item.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-medium">
                      <Clock className="h-3 w-3" />
                      <span>{item.timestamp}</span>
                      {item.targetUrl && (
                        <span className="inline-flex items-center gap-0.5 text-indigo-400 group-hover:underline ml-auto">
                          View
                          <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Hover) */}
                  <div className="absolute right-2.5 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!item.isRead && (
                      <button
                        onClick={(e) => markAsRead(item.id, e)}
                        className="rounded p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => removeNotification(item.id, e)}
                      className="rounded p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-2.5 bg-slate-900/50 text-[11px]">
              <span className="text-slate-500">
                {unreadCount === 0 ? 'All caught up' : `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`}
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (resolvedRole === 'platform_admin') {
                    navigate('/admin/dashboard');
                  } else if (resolvedRole === 'teacher') {
                    navigate('/teacher/notifications');
                  } else if (resolvedRole === 'institute_admin') {
                    navigate('/institute-admin/institute-manager/notifications');
                  } else {
                    navigate('/student/dashboard');
                  }
                }}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Dashboard Overview</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
