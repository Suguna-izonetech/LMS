import React, { useEffect, useState } from 'react';
import { Video, Play, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';

interface LiveClass {
  id: number;
  course_title: string;
  batch_name: string;
  title: string;
  description: string;
  scheduled_date: string;
  status: string;
  meeting_link: string;
}

export const LiveClasses: React.FC = () => {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/live-classes');
      setClasses(res.data);
    } catch (err) {
      console.error('Error fetching student live classes', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your live class schedules..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          Live Classes
        </h1>
        <p className="text-sm text-slate-400">
          Join your scheduled interactive class sessions.
        </p>
      </div>

      <div className="space-y-4">
        {classes.map((cls) => {
          const classDate = new Date(cls.scheduled_date);
          const isUpcoming = cls.status === 'upcoming';

          return (
            <Card key={cls.id} className="hover:border-sky-500/40 transition-all">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[11px] font-bold uppercase tracking-wider">
                      {cls.course_title}
                    </span>
                    <span className="text-xs text-slate-500">({cls.batch_name})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isUpcoming ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {cls.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100">{cls.title}</h3>
                  <p className="text-xs text-slate-400 max-w-2xl">{cls.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{classDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{classDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {cls.meeting_link && (
                    <a
                      href={cls.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-md shadow-sky-900/30 transition-all"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>Join Live Session</span>
                    </a>
                  )}

                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
export default LiveClasses;
