import React, { useEffect, useState } from 'react';
import { BookOpen, Video, HelpCircle, CheckSquare, Award, ArrowRight, Play, Clock, Sparkles } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';

interface StudentCourseItem {
  id: number;
  title: string;
  code: string;
  description: string;
  course_type: string;
  duration: string;
  start_date: string | null;
  price: number;
  is_paid: boolean;
  is_accessible: boolean;
  progress_pct: number;
  modules_count: number;
  quizzes_count: number;
  tasks_count: number;
  thumbnail_url?: string;
}

interface DashboardData {
  enrolled_courses_count: number;
  total_courses_count?: number;
  courses?: StudentCourseItem[];
  today_classes: Array<{
    id: number;
    title: string;
    course_title: string;
    time: string;
    meeting_link: string;
    status: string;
  }>;
  upcoming_classes_count: number;
  pending_tasks_count: number;
  active_quizzes_count: number;
  certificates_count: number;
}

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching student dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your student portal dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl bg-linear-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-800/30 p-6 md:p-8 shadow-xl shadow-sky-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Sparkles className="h-64 w-64 text-sky-400" />
        </div>
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 border border-sky-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Active Student Portal</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome back to your learning space!
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Track your classes, learning tasks, and active progress. View all assigned institute courses in "My Courses".
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-sky-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Paid & Enrolled Courses</p>
              <p className="font-display text-2xl font-bold text-slate-100 mt-1">{data?.enrolled_courses_count || 0}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-sky-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">All Available Courses</p>
              <p className="font-display text-2xl font-bold text-slate-100 mt-1">{data?.courses?.length || 0}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-sky-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Upcoming Classes</p>
              <p className="font-display text-2xl font-bold text-slate-100 mt-1">{data?.upcoming_classes_count || 0}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Video className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-sky-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Pending Tasks</p>
              <p className="font-display text-2xl font-bold text-slate-100 mt-1">{data?.pending_tasks_count || 0}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Main Content Grid: Live Sessions and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Today's Live Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Video className="h-4.5 w-4.5 text-sky-400" />
                  <span>Today's Live Classes</span>
                </CardTitle>
                <CardDescription>Scheduled interactive class sessions for paid courses</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {data?.today_classes && data.today_classes.length > 0 ? (
                <div className="space-y-3">
                  {data.today_classes.map((cls) => (
                    <div key={cls.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800/70 gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">{cls.course_title}</span>
                        <h4 className="text-sm font-semibold text-slate-100">{cls.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{cls.time}</span>
                        </div>
                      </div>
                      {cls.meeting_link ? (
                        <a
                          href={cls.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-sm transition-colors"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Join Live Class</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Link Available Soon</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Video className="h-10 w-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm font-medium">No live classes scheduled for today.</p>
                  <p className="text-xs text-slate-600 mt-1">Check back later or view upcoming classes in your schedule.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links & Shortcuts */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
              <CardDescription>Shortcuts to active learning tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                    <HelpCircle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Attempt Quizzes</p>
                    <p className="text-[11px] text-slate-500">Practice questions & assessments</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </div>

              <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Study Materials & Books</p>
                    <p className="text-[11px] text-slate-500">Download handouts & e-books</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </div>

              <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <CheckSquare className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Submit Assignments</p>
                    <p className="text-[11px] text-slate-500">Upload solutions before deadline</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};
export default StudentDashboard;

