import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Clock, Award } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';

interface MainExam {
  id: number;
  title: string;
  description: string | null;
  course_title: string;
  duration_minutes: number;
  total_marks: number;
}

export const MainExams: React.FC = () => {
  const [exams, setExams] = useState<MainExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/main-exams')
      .then((response) => setExams(response.data))
      .catch((error) => console.error('Error fetching main exams', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState message="Loading main exams..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">Main Exams</h1>
        <p className="text-sm text-slate-400">View main exams allocated by your institute or platform administration.</p>
      </div>

      {exams.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-500">No main exams are currently allocated to your enrolled courses.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {exams.map((exam) => (
            <Card key={exam.id} className="flex flex-col justify-between border-amber-500/20">
              <CardHeader>
                <span className="w-fit rounded-md bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-400">{exam.course_title}</span>
                <CardTitle className="text-lg font-bold text-slate-100">{exam.title}</CardTitle>
                <CardDescription className="text-xs text-slate-400">{exam.description || 'Main examination allocated by administration.'}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between border-t border-slate-900 pt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-sky-400" />{exam.duration_minutes} Mins</span>
                <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-amber-400" />{exam.total_marks} Marks</span>
                <ClipboardCheck className="h-4 w-4 text-amber-400" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MainExams;
