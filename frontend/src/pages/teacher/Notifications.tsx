import React, { useEffect, useState } from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { teacherApi } from '../../api/teacher';

export const Notifications: React.FC = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await teacherApi.getNotifications();
      setNotifications(res);
    } catch (err) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await teacherApi.markAllNotificationsRead();
      toast.success('All notifications marked as read.');
      loadData();
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await teacherApi.markNotificationRead(id);
      loadData();
    } catch (err) {
      console.error('Failed to mark notification read.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading alerts inbox...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Bell className="h-6 w-6 text-violet-400" />
            <span>Notifications</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Stay updated with course alerts, grading reports, and student signups.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs text-violet-400 cursor-pointer">
            Mark all read
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-slate-850">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-550">
              <Bell className="h-10 w-10 text-slate-650 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Inbox is empty</p>
            </div>
          ) : (
            notifications.map((notif) => {
              let Icon = Info;
              let iconColor = 'text-blue-450 bg-blue-955/20 border-blue-500/20';
              if (notif.type === 'Live Class' || notif.type === 'Quiz') {
                Icon = CheckCircle2;
                iconColor = 'text-emerald-450 bg-emerald-955/20 border-emerald-500/20';
              } else if (notif.type === 'Admin Message' || notif.type === 'System Notification') {
                Icon = AlertTriangle;
                iconColor = 'text-amber-450 bg-amber-955/20 border-amber-500/20';
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                  className={`
                    flex items-start gap-4 p-5 transition-colors cursor-pointer
                    ${notif.is_read ? 'bg-transparent hover:bg-slate-900/10' : 'bg-violet-955/5 hover:bg-violet-955/10'}
                  `}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${iconColor}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-200">{notif.title}</h4>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-450 leading-relaxed font-semibold">{notif.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default Notifications;
