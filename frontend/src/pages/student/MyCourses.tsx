import React, { useEffect, useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
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

type CourseList = StudentCourse[];

export const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseList>([]);
  const [showAvailable, setShowAvailable] = useState(false);
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

  const browseAvailableCourses = async () => {
    if (!showAvailable && availableCourses.length === 0) {
      try {
        const res = await api.get('/student/available-courses');
        setAvailableCourses(res.data);
      } catch (err) {
        console.error('Error fetching available courses', err);
      }
    }
    setShowAvailable(prev => !prev);
  };

  if (loading) {
    return <LoadingState message="Loading your enrolled courses..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">My Enrolled Courses</h1>
            <p className="text-sm text-slate-400">Access your active courses, lectures, modules, and learning progress.</p>
          </div>
          <button
            type="button"
            onClick={browseAvailableCourses}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{showAvailable ? 'Hide Available Courses' : 'Available Courses'}</span>
          </button>
        </div>
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
                    className="h-full bg-linear-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
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

      {showAvailable && (
        <section className="space-y-4 border-t border-slate-900 pt-6">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-100">Available Courses</h2>
            <p className="text-sm text-slate-400">Browse published courses that are not part of your enrollment.</p>
          </div>
          {availableCourses.length === 0 ? (
            <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-500">No additional courses are currently available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableCourses.map((course) => (
                <Card key={course.id} className="flex flex-col justify-between border-slate-800">
                  <CardHeader>
                    <span className="inline-block w-fit rounded-md bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-400">{course.code}</span>
                    <CardTitle className="text-lg font-bold text-slate-100">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3 text-xs text-slate-400">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs text-slate-500">
                    {course.modules_count} modules, {course.quizzes_count} quizzes, {course.tasks_count} tasks
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
export default MyCourses;
