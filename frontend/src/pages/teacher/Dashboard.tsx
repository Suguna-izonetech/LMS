import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Video, Calendar, ArrowRight, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { KpiCard } from '../../components/ui/KpiCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { teacherApi } from '../../api/teacher';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await teacherApi.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading dashboard performance metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-200">Error Loading Dashboard</h3>
          <p className="max-w-md text-sm text-slate-500">{error || 'An unexpected error occurred.'}</p>
        </div>
        <Button onClick={fetchDashboardData} className="bg-violet-600 hover:bg-violet-500">
          Try Again
        </Button>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Students', value: String(data.total_students), icon: Users, desc: 'Across all registered courses' },
    { title: 'My Active Courses', value: String(data.total_assigned_courses), icon: BookOpen, desc: 'Currently teaching this term' },
    { title: 'Live Classes Today', value: String(data.today_classes.length), icon: Video, desc: 'Scheduled streams' },
    { title: 'Avg. Attendance', value: `${data.attendance_percentage}%`, icon: Calendar, desc: 'Calculated over last 30 days' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          Welcome back, Teacher!
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Here is an overview of your classrooms, live schedules, and student submissions for today.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <KpiCard
            key={idx}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            description={kpi.desc}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Live Classes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Live Classes</CardTitle>
              <p className="text-xs text-slate-500 font-medium">Click join to open the live class session</p>
            </div>
            <Video className="h-4.5 w-4.5 text-violet-400" />
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {data.today_classes.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No classes scheduled for today.
              </div>
            ) : (
              data.today_classes.map((cls: any) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-slate-850 bg-slate-900/60 hover:bg-slate-900 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                      {cls.time}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-200">{cls.title}</h4>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      cls.status === 'live' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {cls.status}
                    </span>
                  </div>
                  {cls.url && (
                    <Button
                      size="sm"
                      onClick={() => window.open(cls.url, '_blank')}
                      className="flex items-center gap-1.5 cursor-pointer bg-violet-600 hover:bg-violet-500"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Join</span>
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Student Activity</CardTitle>
              <p className="text-xs text-slate-500 font-medium">Latest interactions from your classrooms</p>
            </div>
            <Users className="h-4.5 w-4.5 text-violet-400" />
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {data.recent_student_activities.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No recent activity recorded.
              </div>
            ) : (
              data.recent_student_activities.map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between border-b border-slate-850 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-200">
                      {act.student_name}{' '}
                      <span className="font-normal text-violet-400">{act.action}</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium">"{act.detail}"</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 ml-4">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.hash = '#/teacher/reports'}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-950/20 cursor-pointer"
              >
                <span>View Full Activity Reports</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Dashboard;
