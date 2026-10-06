import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Clock, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, Calendar, FileText, CheckSquare, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { teacherApi } from '../../api/teacher';

export const Courses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseDetail, setCourseDetail] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await teacherApi.getCourses();
      setCourses(res);
    } catch (err: any) {
      setError('Failed to fetch assigned courses.');
    } finally {
      setLoading(false);
    }
  };


  const fetchCourseDetails = async (id: number) => {
    try {
      setDetailLoading(true);
      const [detailRes, studentsRes, activityRes] = await Promise.all([
        teacherApi.getCourse(id),
        teacherApi.getCourseStudents(id),
        teacherApi.getCourseActivity(id),
      ]);
      setCourseDetail(detailRes);
      setStudents(studentsRes);
      setActivities(activityRes);
      setSelectedCourseId(id);
    } catch (err: any) {
      alert('Failed to load classroom details.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading || detailLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading classroom workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <p className="text-sm text-slate-500 max-w-sm">{error}</p>
        <Button onClick={fetchCourses} className="bg-violet-600 hover:bg-violet-500">Retry</Button>
      </div>
    );
  }

  // --- SUBVIEW: COURSE DETAILS COCKPIT ---
  if (selectedCourseId && courseDetail) {
    const tabs = [
      { id: 'overview', name: 'Overview', icon: BookOpen },
      { id: 'batches', name: 'Batches', icon: Users },
      { id: 'students', name: 'Students', icon: Users },
      { id: 'classes', name: 'Live Classes', icon: Calendar },
      { id: 'materials', name: 'Materials', icon: FileText },
      { id: 'quizzes', name: 'Quizzes', icon: CheckSquare },
      { id: 'tasks', name: 'Tasks', icon: FileText },
      { id: 'activity', name: 'Course Activity', icon: Activity }
    ];

    return (
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedCourseId(null)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Courses</span>
          </Button>
        </div>

        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold text-violet-400 bg-violet-950/40 border border-violet-800/40 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              {courseDetail.code}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">{courseDetail.title}</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">{courseDetail.description || 'No description provided.'}</p>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              <span>Duration: <strong className="text-slate-200">{courseDetail.duration || 'Self-paced'}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-violet-400" />
              <span>Starts: <strong className="text-slate-200">{courseDetail.start_date ? new Date(courseDetail.start_date).toLocaleDateString() : 'Immediate'}</strong></span>
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-850 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md border transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="mt-4">
          {activeTab === 'overview' && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-base font-semibold text-slate-200">Classroom Objectives</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  This course is mapped under syllabus standards. You are configured to deliver lectures, schedule live broadcasts, mark student attendance, publish quizzes, manage homework assignments, and update study books.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-850">
                  <div>
                    <p className="text-2xl font-bold text-slate-200">{students.length}</p>
                    <p className="text-xs text-slate-500">Students Enrolled</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-200">{courseDetail.batches.length}</p>
                    <p className="text-xs text-slate-500">Assigned Batches</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-200">{courseDetail.quizzes.length}</p>
                    <p className="text-xs text-slate-500">Total Quizzes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-200">{courseDetail.tasks.length}</p>
                    <p className="text-xs text-slate-500">Total Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'batches' && (
            <div className="grid gap-4 md:grid-cols-2">
              {courseDetail.batches.map((b: any) => (
                <Card key={b.id}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">{b.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">Assigned Group for current term</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'students' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-900/60 text-slate-400 font-bold">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Performance Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500">No students enrolled yet.</td>
                        </tr>
                      ) : (
                        students.map((s: any) => (
                          <tr key={s.id} className="hover:bg-slate-900/40 text-slate-300">
                            <td className="p-4 font-semibold text-slate-200">{s.name}</td>
                            <td className="p-4 text-slate-400">{s.email}</td>
                            <td className="p-4 text-slate-400">{s.phone || 'N/A'}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/20 text-emerald-450 border border-emerald-900/20">
                                {s.performance}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'classes' && (
            <div className="space-y-3">
              {courseDetail.live_classes.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-slate-500 text-xs">No live sessions recorded.</CardContent></Card>
              ) : (
                courseDetail.live_classes.map((cls: any) => (
                  <Card key={cls.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{cls.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">Scheduled: {new Date(cls.scheduled_date).toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{cls.status}</span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-3">
              {courseDetail.materials.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-slate-500 text-xs">No study materials published.</CardContent></Card>
              ) : (
                courseDetail.materials.map((m: any) => (
                  <Card key={m.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{m.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">Type: {m.type} • Visibility: {m.visibility}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-450">{m.status}</span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="space-y-3">
              {courseDetail.quizzes.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-slate-500 text-xs">No quizzes created.</CardContent></Card>
              ) : (
                courseDetail.quizzes.map((q: any) => (
                  <Card key={q.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{q.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">Duration: {q.duration}m • Marks: {q.marks}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{q.status}</span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {courseDetail.tasks.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-slate-500 text-xs">No task assignments configured.</CardContent></Card>
              ) : (
                courseDetail.tasks.map((t: any) => (
                  <Card key={t.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{t.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">Deadline: {new Date(t.deadline).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{t.status}</span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <Card>
              <CardContent className="p-5 space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">No activity logged for this classroom.</div>
                ) : (
                  activities.map((a: any) => (
                    <div key={a.id} className="flex items-start justify-between border-b border-slate-850 pb-3 last:border-b-0 last:pb-0">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-200">
                          {a.student_name} <span className="font-normal text-violet-400">{a.action}</span>
                        </p>
                        <p className="text-xs text-slate-550">"{a.detail}"</p>
                      </div>
                      <span className="text-[10px] text-slate-550 shrink-0 ml-4">
                        {new Date(a.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN VIEW: COURSES GRID ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Assigned Courses
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            View and manage classrooms and courses assigned to you by the institute administrator.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No courses assigned yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">You currently have no courses assigned. When the institute administrator assigns a course to you, it will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {course.code}
                  </span>
                </div>
                <CardTitle className="text-base font-bold line-clamp-1">{course.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="p-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-4 w-4 text-violet-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-200">{course.duration || 'Self-paced'}</p>
                      <p className="text-[10px] text-slate-500">Duration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4 text-violet-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-200">
                        {course.start_date ? new Date(course.start_date).toLocaleDateString() : 'Immediate'}
                      </p>
                      <p className="text-[10px] text-slate-500">Starts</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-850">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="h-4 w-4 text-violet-400" />
                    <div>
                      <p className="font-bold text-slate-200">{course.student_count ?? 0}</p>
                      <p className="text-[10px] text-slate-550">Enrolled Students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <BookOpen className="h-4 w-4 text-violet-400" />
                    <div>
                      <p className="font-bold text-slate-200">Active</p>
                      <p className="text-[10px] text-slate-550">Status</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-850">
                  <Button
                    variant="ghost"
                    onClick={() => fetchCourseDetails(course.id)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-950/10 cursor-pointer"
                  >
                    <span>Enter Classroom</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default Courses;
