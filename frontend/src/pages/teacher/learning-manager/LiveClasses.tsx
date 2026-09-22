import React, { useState, useEffect } from 'react';
import { Video, Calendar, Plus, Play, Trash2, Users, Check, X, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../context/ToastContext';
import { teacherApi } from '../../../api/teacher';

export const LiveClasses: React.FC = () => {
  const toast = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [liveClassUrl, setLiveClassUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // Attendance states
  const [attendanceClassId, setAttendanceClassId] = useState<number | null>(null);
  const [attendanceClassName, setAttendanceClassName] = useState<string>('');
  const [attendanceStudents, setAttendanceStudents] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, coursesRes] = await Promise.all([
        teacherApi.getLiveClasses(),
        teacherApi.getCourses()
      ]);
      setClasses(classesRes);
      setCourses(coursesRes);
      if (coursesRes.length > 0) {
        setSelectedCourseId(String(coursesRes[0].id));
      }
    } catch (err: any) {
      toast.error('Failed to load classes or courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update batches when selected course changes
  useEffect(() => {
    if (selectedCourseId) {
      const fetchCourseDetails = async () => {
        try {
          const detail = await teacherApi.getCourse(Number(selectedCourseId));
          const courseBatches = detail.batches || [];
          setBatches(courseBatches);
          if (courseBatches.length > 0) {
            setSelectedBatchId(String(courseBatches[0].id));
          } else {
            setSelectedBatchId('');
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchCourseDetails();
    }
  }, [selectedCourseId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !dateTime || !liveClassUrl || !selectedCourseId || !selectedBatchId) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (!liveClassUrl.startsWith('http://') && !liveClassUrl.startsWith('https://')) {
      toast.warning('Please enter a valid URL starting with https:// or http://');
      return;
    }

    try {
      await teacherApi.scheduleLiveClass({
        course_id: Number(selectedCourseId),
        batch_id: Number(selectedBatchId),
        title: topic,
        description: `Live session on ${topic}`,
        scheduled_date: new Date(dateTime).toISOString(),
        meeting_link: liveClassUrl,
        live_class_url: liveClassUrl,
        youtube_live_url: liveClassUrl
      });
      toast.success('Live class scheduled successfully!');
      setTopic('');
      setDateTime('');
      setLiveClassUrl('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to schedule class.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled class?')) return;
    try {
      await teacherApi.cancelLiveClass(id);
      toast.success('Scheduled live class removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete live class.');
    }
  };

  // Open Attendance Sheet
  const handleOpenAttendance = async (classId: number, className: string) => {
    try {
      setAttendanceLoading(true);
      setAttendanceClassId(classId);
      setAttendanceClassName(className);
      const res = await teacherApi.getClassAttendance(classId);
      setAttendanceStudents(res);
    } catch (err) {
      toast.error('Failed to load students attendance sheet.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSetStudentStatus = (studentId: number, status: string) => {
    setAttendanceStudents(prev =>
      prev.map(s => (s.student_id === studentId ? { ...s, status } : s))
    );
  };

  const handleSaveAttendance = async () => {
    if (!attendanceClassId) return;
    try {
      const payload = attendanceStudents.map(s => ({
        student_id: s.student_id,
        status: s.status
      }));
      await teacherApi.saveClassAttendance(attendanceClassId, payload);
      toast.success('Attendance saved and class marked as completed!');
      setAttendanceClassId(null);
      loadData();
    } catch (err) {
      toast.error('Failed to save attendance records.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading broadcasts...</p>
      </div>
    );
  }

  // --- SUBVIEW: ATTENDANCE SHEET ---
  if (attendanceClassId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setAttendanceClassId(null)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Live Classes</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
              Take Attendance
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Mark attendance for class: <span className="text-violet-400 font-bold">{attendanceClassName}</span>
            </p>
          </div>
          <Button onClick={handleSaveAttendance} className="bg-violet-600 hover:bg-violet-500">
            Submit Attendance
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {attendanceLoading ? (
              <div className="flex justify-center p-8"><RefreshCw className="h-6 w-6 animate-spin text-violet-500" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-450 uppercase tracking-wider bg-slate-900/40 font-bold">
                      <th className="p-4 pl-6">Student Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {attendanceStudents.map((s) => (
                      <tr key={s.student_id} className="hover:bg-slate-900/20 text-slate-300">
                        <td className="p-4 pl-6 font-bold text-slate-200">{s.student_name}</td>
                        <td className="p-4 text-slate-500">{s.email}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`
                              px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider
                              ${
                                s.status === 'present'
                                  ? 'text-emerald-450 bg-emerald-950/20'
                                  : s.status === 'absent'
                                  ? 'text-rose-450 bg-rose-950/20'
                                  : s.status === 'late'
                                  ? 'text-amber-450 bg-amber-950/20'
                                  : 'text-slate-500 bg-slate-850'
                              }
                            `}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleSetStudentStatus(s.student_id, 'present')}
                              className={`p-1.5 rounded-md border cursor-pointer ${
                                s.status === 'present'
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleSetStudentStatus(s.student_id, 'absent')}
                              className={`p-1.5 rounded-md border cursor-pointer ${
                                s.status === 'absent'
                                  ? 'bg-rose-600 border-rose-500 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleSetStudentStatus(s.student_id, 'late')}
                              className={`p-1.5 rounded-md border cursor-pointer ${
                                s.status === 'late'
                                  ? 'bg-amber-600 border-amber-500 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- MAIN VIEW: LIVE CLASSES ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          Live Classes
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Schedule, stream, and manage your live class broadcasts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Schedule Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-violet-400" />
              <span>Schedule Live Class</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSchedule} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Select Course</label>
                <Select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  options={courses.map(c => ({ value: String(c.id), label: c.title }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Select Batch</label>
                <Select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  options={batches.map(b => ({ value: String(b.id), label: b.name }))}
                  disabled={batches.length === 0}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Lecture Topic</label>
                <Input
                  placeholder="e.g. Next.js Routing Systems"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Live Class URL</label>
                <Input
                  type="url"
                  placeholder="https://... (e.g. Zoom, Google Meet, YouTube Live)"
                  value={liveClassUrl}
                  onChange={(e) => setLiveClassUrl(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer mt-2">
                Create Schedule
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Schedule List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scheduled Live Class Broadcasts</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
                  <Video className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-300">No scheduled broadcasts</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">Use the form on the left to schedule a new live class broadcast for your batches.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-slate-850 bg-slate-900/40 hover:bg-slate-900 transition-colors gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-violet-400 bg-violet-950/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {cls.course_title} • {cls.batch_name}
                      </span>
                      <h4 className="text-sm font-bold text-slate-200">{cls.title}</h4>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(cls.scheduled_date).toLocaleString()}
                      </p>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        cls.status === 'live' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 
                        cls.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {cls.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {(cls.meeting_link || cls.live_class_url || cls.youtube_live_url) && (
                        <Button
                          size="sm"
                          onClick={() => window.open(cls.meeting_link || cls.live_class_url || cls.youtube_live_url, '_blank')}
                          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 cursor-pointer text-xs"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Go Live</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleOpenAttendance(cls.id, cls.title)}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 cursor-pointer text-xs text-slate-200"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Attendance</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(cls.id)}
                        className="text-rose-400 hover:text-rose-350 hover:bg-rose-950/20 cursor-pointer p-2"
                        aria-label="Delete schedule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default LiveClasses;
