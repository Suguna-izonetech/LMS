import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Video,
  UserPlus,
  DollarSign,
  Activity,
  CreditCard,
  FileText,
  Award
} from 'lucide-react';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  LoadingState,
  EmptyState,
  ErrorState
} from '../components/ui';
import api from '../api/client';

interface DashboardSummary {
  students: number;
  teachers: number;
  courses: number;
  active_batches: number;
  todays_classes: number;
  pending_leads: number;
  monthly_revenue: number;
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  time: string;
}

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [summaryRes, activitiesRes] = await Promise.all([
        api.get('/institute-admin/dashboard/summary'),
        api.get('/institute-admin/dashboard/recent-activities')
      ]);
      setSummary(summaryRes.data);
      setActivities(activitiesRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" description="Loading metrics summary..." breadcrumbs={<Breadcrumb items={[]} />} />
        <LoadingState message="Fetching live data from your institute..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" description="Error loading stats." breadcrumbs={<Breadcrumb items={[]} />} />
        <ErrorState
          title="Failed to Load"
          message={error}
          onRetry={fetchDashboardData}
          retryLabel="Retry"
        />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" description="No metrics summary available." breadcrumbs={<Breadcrumb items={[]} />} />
        <EmptyState
          title="No Data Available"
          description="We couldn't find any data for your institute."
        />
      </div>
    );
  }

  const kpis = [
    { title: 'Students', value: summary.students.toLocaleString(), icon: <Users className="h-5 w-5 text-emerald-400" /> },
    { title: 'Teachers', value: summary.teachers.toLocaleString(), icon: <GraduationCap className="h-5 w-5 text-indigo-400" /> },
    { title: 'Courses', value: summary.courses.toLocaleString(), icon: <BookOpen className="h-5 w-5 text-blue-400" /> },
    { title: 'Active Batches', value: summary.active_batches.toLocaleString(), icon: <CalendarDays className="h-5 w-5 text-violet-400" /> },
    { title: "Today's Classes", value: summary.todays_classes.toLocaleString(), icon: <Video className="h-5 w-5 text-pink-400" /> },
    { title: 'Pending Leads', value: summary.pending_leads.toLocaleString(), icon: <UserPlus className="h-5 w-5 text-amber-400" /> },
    { title: 'Monthly Revenue', value: `₹${summary.monthly_revenue.toLocaleString()}`, icon: <DollarSign className="h-5 w-5 text-emerald-500" /> },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'student': return <Users className="h-4 w-4 text-indigo-400" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-emerald-400" />;
      case 'quiz': return <FileText className="h-4 w-4 text-amber-400" />;
      case 'certificate': return <Award className="h-4 w-4 text-violet-400" />;
      case 'lead': return <UserPlus className="h-4 w-4 text-pink-400" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="High-level overview of your institute's activities and performance."
        breadcrumbs={<Breadcrumb items={[]} />}
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} hoverable>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                  {kpi.title}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 border border-slate-800/80 shadow-inner">
                  {kpi.icon}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <span className="font-display text-2xl font-bold tracking-tight text-slate-100">
                  {kpi.value}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest events and updates across your institute.</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 border border-slate-800 shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-semibold text-slate-200">{activity.description}</span>
                      <span className="text-xs font-medium text-slate-500">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No Recent Activities" 
                description="There are no new activities recorded yet." 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
