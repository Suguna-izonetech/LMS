import React, { useEffect, useState } from 'react';
import { UserCheck, Book, Mail, Award, ArrowLeft, RefreshCw, Phone, Calendar, Activity, CheckSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { teacherApi } from '../../api/teacher';

export const Students: React.FC = () => {
  const toast = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Inspector States
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await teacherApi.getStudents();
      setStudents(res);
    } catch (err) {
      toast.error('Failed to load students ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenProfile = async (id: number) => {
    try {
      setProfileLoading(true);
      setSelectedStudentId(id);
      const [profRes, actRes, attRes] = await Promise.all([
        teacherApi.getStudent(id),
        teacherApi.getStudentActivity(id),
        teacherApi.getStudentAttendance(id)
      ]);
      setProfile(profRes);
      setActivities(actRes);
      setAttendance(attRes);
    } catch (err) {
      toast.error('Failed to load student profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading student directory...</p>
      </div>
    );
  }

  // --- SUBVIEW: STUDENT PROFILE INSPECTOR ---
  if (selectedStudentId && profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSelectedStudentId(null); loadData(); }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Students</span>
          </Button>
        </div>

        <div className="flex items-center gap-4 border-b border-slate-850 pb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-650 text-slate-100 text-xl font-bold">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-100">{profile.name}</h1>
            <p className="text-sm text-slate-500">Student ID: #{profile.id} • Joined: {new Date(profile.joined_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal Info & Mapped Courses */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader><CardTitle>Academic Profile</CardTitle></CardHeader>
              <CardContent className="p-5 space-y-3.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-violet-400" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-violet-400" />
                  <span>{profile.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-violet-400" />
                  <span>Performance: {profile.performance}</span>
                </div>

                <div className="border-t border-slate-850 pt-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Registered Classrooms</span>
                  <div className="space-y-1.5">
                    {profile.courses.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-1.5 text-slate-400">
                        <Book className="h-3.5 w-3.5 text-slate-600" />
                        <span>{c.title} ({c.code})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Summary */}
            <Card>
              <CardHeader><CardTitle>Attendance Log</CardTitle></CardHeader>
              <CardContent className="p-5 space-y-3 max-h-[300px] overflow-y-auto">
                {attendance.length === 0 ? (
                  <p className="text-xs text-slate-550 italic">No attendance records.</p>
                ) : (
                  attendance.map(att => (
                    <div key={att.id} className="flex justify-between items-center text-xs border-b border-slate-850 pb-2 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-slate-350">{att.class_title}</p>
                        <p className="text-[9px] text-slate-550">{new Date(att.marked_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        att.status === 'present' ? 'bg-emerald-950 text-emerald-450' : 'bg-rose-950 text-rose-455'
                      }`}>
                        {att.status}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Timelines */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-300">Classroom Timeline</h3>
            <Card>
              <CardContent className="p-5 space-y-4">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-550 text-center py-6">No recent learning activities logged.</p>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 border-b border-slate-850 pb-3 last:border-b-0 last:pb-0">
                      <div className="h-7 w-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-violet-400 shrink-0">
                        <Activity className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs font-semibold text-slate-200">
                          {act.action.toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500">"{act.detail}"</p>
                        <p className="text-[9px] text-slate-550">{new Date(act.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN VIEW: STUDENTS TABLE ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          My Students
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          View all students enrolled in your batches, along with performance indicators.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-455 uppercase tracking-wider bg-slate-900/40 font-bold">
                  <th className="p-4 pl-6">Student Name</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Course Mapped</th>
                  <th className="p-4 text-center">Avg. Attendance</th>
                  <th className="p-4">Latest Activity</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-900/20 text-slate-300">
                    <td className="p-4 pl-6 font-bold text-slate-200">{student.name}</td>
                    <td className="p-4 text-slate-500">{student.phone || 'N/A'}</td>
                    <td className="p-4 text-slate-400 font-semibold">{student.course}</td>
                    <td className="p-4 text-center font-bold text-slate-350">{student.attendance}</td>
                    <td className="p-4 text-slate-500 italic">"{student.latest_activity}"</td>
                    <td className="p-4 pr-6 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenProfile(student.id)}
                        className="bg-violet-600 hover:bg-violet-550 text-xs px-3"
                      >
                        Inspect Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Students;
