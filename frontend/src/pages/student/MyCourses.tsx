import React, { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Clock, Calendar, DollarSign, Lock, Unlock, CheckCircle2, X, Video, HelpCircle, CheckSquare, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { useToast } from '../../context/ToastContext';

interface StudentCourse {
  id: number;
  title: string;
  code: string;
  description: string;
  course_type?: string;
  duration?: string;
  start_date?: string | null;
  price?: number;
  is_paid?: boolean;
  is_accessible?: boolean;
  progress_pct: number;
  modules_count: number;
  quizzes_count: number;
  tasks_count: number;
}

export const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModalCourse, setPayModalCourse] = useState<StudentCourse | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [detailCourse, setDetailCourse] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { success, error: showError } = useToast();

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

  const handleConfirmPayment = async () => {
    if (!payModalCourse) return;
    setIsProcessingPayment(true);
    try {
      const res = await api.post(`/student/courses/${payModalCourse.id}/pay`);
      success(res.data?.message || `Payment completed for ${payModalCourse.title}! Course is now accessible.`);
      setCourses(prev =>
        prev.map(c => (c.id === payModalCourse.id ? { ...c, is_paid: true, is_accessible: true } : c))
      );
      setPayModalCourse(null);
    } catch (err: any) {
      console.error(err);
      showError(err.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAccessCourse = async (course: StudentCourse) => {
    if (!course.is_paid) {
      setPayModalCourse(course);
      return;
    }

    setLoadingDetail(true);
    try {
      const res = await api.get(`/student/courses/${course.id}`);
      setDetailCourse(res.data);
    } catch (err: any) {
      console.error(err);
      showError(err.response?.data?.detail || 'Failed to load course contents');
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your courses..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">Assigned Institute Courses</h1>
          <p className="text-sm text-slate-400">
            View all courses created by your institute administrator. Only paid courses are accessible for learning materials and classroom sessions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card 
            key={course.id} 
            className={`flex flex-col justify-between transition-all duration-200 ${
              course.is_paid 
                ? 'border-emerald-500/30 hover:border-emerald-500/60 bg-slate-900/70 shadow-lg shadow-emerald-950/10' 
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 font-mono text-[11px] font-bold">
                  {course.code}
                </span>
                {course.is_paid ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Paid & Accessible</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60 uppercase">
                    <Lock className="h-3 w-3" />
                    <span>Payment Required</span>
                  </span>
                )}
              </div>
              <CardTitle className="text-lg font-bold text-slate-100 leading-snug line-clamp-1">
                {course.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-xs text-slate-400">
                {course.description || 'Comprehensive curriculum created by your institute administrator.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* Course Meta: Duration, Start Date, Payment */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-slate-850 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Duration:</span>
                  </span>
                  <strong className="text-slate-200">{course.duration || 'Self-paced'}</strong>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-sky-400" />
                    <span>Starts:</span>
                  </span>
                  <strong className="text-slate-200">
                    {course.start_date ? new Date(course.start_date).toLocaleDateString() : 'Ongoing'}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                    <span>Fee / Payment:</span>
                  </span>
                  <strong className={`font-bold ${course.is_paid ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {course.is_paid ? 'Paid' : (course.price === 0 ? 'Free' : `$${course.price?.toFixed(2)}`)}
                  </strong>
                </div>
              </div>

              {/* Progress bar (if paid) */}
              {course.is_paid ? (
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
              ) : null}

              {/* Action Button */}
              <div className="pt-1">
                {course.is_paid ? (
                  <Button
                    variant="primary"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20"
                    onClick={() => handleAccessCourse(course)}
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Access Course Content</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => setPayModalCourse(course)}
                    className="w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Pay {course.price === 0 ? 'Now (Free)' : `$${course.price?.toFixed(2)}`} to Unlock</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PAYMENT MODAL */}
      {payModalCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setPayModalCourse(null)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                <Lock className="h-3.5 w-3.5" />
                <span>Payment & Enrollment</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{payModalCourse.title}</h3>
              <p className="text-xs text-slate-400">
                Unlock full course access, live lectures, quizzes, and learning materials.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Course Code:</span>
                <span className="font-mono text-slate-200 font-bold">{payModalCourse.code}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Duration:</span>
                <span className="text-slate-200 font-semibold">{payModalCourse.duration || 'Self-paced'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Start Date:</span>
                <span className="text-slate-200 font-semibold">
                  {payModalCourse.start_date ? new Date(payModalCourse.start_date).toLocaleDateString() : 'Immediate'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800 font-medium">
                <span className="text-sm font-bold text-slate-200">Total Course Fee:</span>
                <span className="text-base font-extrabold text-amber-400">
                  {payModalCourse.price === 0 ? 'Free' : `$${payModalCourse.price?.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPayModalCourse(null)}
                className="flex-1"
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                isLoading={isProcessingPayment}
              >
                Confirm & Pay Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* COURSE CONTENT MODAL (ACCESSIBLE FOR PAID COURSES) */}
      {detailCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setDetailCourse(null)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 p-1 rounded-lg cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-mono uppercase">
                {detailCourse.code} • Paid & Unlocked
              </span>
              <h3 className="text-xl font-bold text-slate-100">{detailCourse.title}</h3>
              <p className="text-xs text-slate-400">{detailCourse.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <div>
                <span className="text-slate-500">Duration: </span>
                <strong className="text-slate-200">{detailCourse.duration || 'Self-paced'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Starts: </span>
                <strong className="text-slate-200">
                  {detailCourse.start_date ? new Date(detailCourse.start_date).toLocaleDateString() : 'Ongoing'}
                </strong>
              </div>
            </div>

            {/* Live Classes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-sky-400" />
                <span>Live Classes ({detailCourse.live_classes?.length || 0})</span>
              </h4>
              {detailCourse.live_classes && detailCourse.live_classes.length > 0 ? (
                <div className="space-y-2">
                  {detailCourse.live_classes.map((lc: any) => (
                    <div key={lc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/60 text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">{lc.title}</p>
                        <p className="text-[11px] text-slate-500">{new Date(lc.scheduled_date).toLocaleString()}</p>
                      </div>
                      {lc.meeting_link && (
                        <a href={lc.meeting_link} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline font-semibold">
                          Join Stream
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No scheduled live classes yet.</p>
              )}
            </div>

            {/* Materials */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                <span>Study Materials ({detailCourse.materials?.length || 0})</span>
              </h4>
              {detailCourse.materials && detailCourse.materials.length > 0 ? (
                <div className="space-y-2">
                  {detailCourse.materials.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/60 text-xs">
                      <p className="font-semibold text-slate-200">{m.title}</p>
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-semibold">
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No study materials published yet.</p>
              )}
            </div>

            {/* Quizzes & Tasks */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <HelpCircle className="h-3.5 w-3.5 text-violet-400" />
                  <span>Quizzes ({detailCourse.quizzes?.length || 0})</span>
                </h4>
                {detailCourse.quizzes?.map((q: any) => (
                  <p key={q.id} className="text-slate-300 py-1 border-b border-slate-850 truncate">{q.title}</p>
                ))}
              </div>
              <div>
                <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CheckSquare className="h-3.5 w-3.5 text-amber-400" />
                  <span>Tasks ({detailCourse.tasks?.length || 0})</span>
                </h4>
                {detailCourse.tasks?.map((t: any) => (
                  <p key={t.id} className="text-slate-300 py-1 border-b border-slate-850 truncate">{t.title}</p>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" onClick={() => setDetailCourse(null)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MyCourses;
