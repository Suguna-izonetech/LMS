import React, { useEffect, useState } from 'react';
import { BookOpen, Layers, CheckCircle2, Clock } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';

interface StudentCourse {
  id: number;
  title: string;
  code: string;
  description: string;
  progress_pct: number;
  modules_count: number;
  quizzes_count: number;
  tasks_count: number;
}

export const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Error fetching enrolled courses', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your enrolled courses..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          My Enrolled Courses
        </h1>
        <p className="text-sm text-slate-400">
          Access your active courses, lectures, modules, and learning progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col justify-between hover:border-sky-500/40 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 font-mono text-[11px] font-bold">
                  {course.code}
                </span>
                <span className="text-xs text-slate-400 font-medium">Active Batch</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-100 leading-snug">
                {course.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-xs text-slate-400">
                {course.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">Course Progress</span>
                  <span className="font-bold text-sky-400">{course.progress_pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress_pct}%` }}
                  />
                </div>
              </div>

              {/* Course Meta Info */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-center text-xs">
                <div className="bg-slate-900/50 p-2 rounded-lg">
                  <p className="font-bold text-slate-200">{course.modules_count}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Modules</p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg">
                  <p className="font-bold text-slate-200">{course.quizzes_count}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Quizzes</p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg">
                  <p className="font-bold text-slate-200">{course.tasks_count}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default MyCourses;
