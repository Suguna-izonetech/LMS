import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { teacherApi } from '../../api/teacher';

export const Attendance: React.FC = () => {
  const toast = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoursesAndLogs = async () => {
    try {
      setLoading(true);
      const coursesRes = await teacherApi.getCourses();
      setCourses(coursesRes);
      
      const params = selectedCourseId !== 'all' ? { course_id: Number(selectedCourseId) } : {};
      const logsRes = await teacherApi.getAttendanceLog(params);
      setLogs(logsRes);
    } catch (err) {
      toast.error('Failed to load attendance registry logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoursesAndLogs();
  }, [selectedCourseId]);

  const handleExport = async () => {
    try {
      const courseId = selectedCourseId !== 'all' ? Number(selectedCourseId) : undefined;
      const response = await teacherApi.exportAttendanceBlob(courseId);
      
      let filename = 'attendance_report.xlsx';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      const contentType = typeof response.headers['content-type'] === 'string' ? response.headers['content-type'] : undefined;
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after a delay so the browser can resolve the download filename correctly
      setTimeout(() => {
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 1000);
      
      toast.success('Attendance Excel download triggered!');
    } catch (err) {
      toast.error('Failed to export attendance report.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading attendance ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Attendance Logs
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            View full log audits and export student registers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            options={[
              { value: 'all', label: 'All Assigned Courses' },
              ...courses.map(c => ({ value: String(c.id), label: c.title }))
            ]}
          />
          <Button onClick={handleExport} className="bg-violet-650 hover:bg-violet-550 cursor-pointer flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Register History Log</CardTitle>
          <span className="text-xs text-slate-550 font-bold uppercase tracking-wider">
            Total Records: {logs.length}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-450 uppercase tracking-widest bg-slate-900/40 font-bold">
                  <th className="p-4 pl-6">Student Name</th>
                  <th className="p-4">Course / Batch</th>
                  <th className="p-4">Class Session</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Marked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-550">No attendance history logged.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/20 text-slate-350">
                      <td className="p-4 pl-6 font-bold text-slate-200">{log.student_name}</td>
                      <td className="p-4 text-slate-500 font-semibold">{log.course_title} <span className="text-violet-400">({log.batch_name})</span></td>
                      <td className="p-4 text-slate-400">{log.class_title}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`
                            px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider
                            ${
                              log.status === 'present'
                                ? 'text-emerald-450 bg-emerald-950/20'
                                : log.status === 'absent'
                                ? 'text-rose-450 bg-rose-950/20'
                                : 'text-amber-450 bg-amber-950/20'
                            }
                          `}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right text-slate-550">
                        {new Date(log.marked_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Attendance;
