import React, { useEffect, useState } from 'react';
import { BarChart3, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { teacherApi } from '../../api/teacher';

export const Reports: React.FC = () => {
  const toast = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'attendance' | 'quiz' | 'tasks' | 'activity'>('attendance');
  const [loading, setLoading] = useState(true);

  // Report Data
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [tasksData, setTasksData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any>(null);

  const loadFilterData = async () => {
    try {
      const coursesRes = await teacherApi.getCourses();
      setCourses(coursesRes);
    } catch (err) {
      console.error('Failed to load courses.');
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const courseId = selectedCourseId !== 'all' ? Number(selectedCourseId) : undefined;
      
      if (activeTab === 'attendance') {
        const res = await teacherApi.getAttendanceReport(courseId);
        setAttendanceData(res);
      } else if (activeTab === 'quiz') {
        const res = await teacherApi.getQuizReport(courseId);
        setQuizData(res);
      } else if (activeTab === 'tasks') {
        const res = await teacherApi.getTaskReport(courseId);
        setTasksData(res);
      } else if (activeTab === 'activity') {
        const res = await teacherApi.getActivityReport(courseId);
        setActivityData(res);
      }
    } catch (err) {
      toast.error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadReport();
  }, [selectedCourseId, activeTab]);

  const handleExportExcel = async () => {
    try {
      const courseId = selectedCourseId !== 'all' ? Number(selectedCourseId) : undefined;
      let response: any;
      let defaultFilename = 'report.xlsx';
      
      if (activeTab === 'attendance') {
        response = await teacherApi.exportAttendanceBlob(courseId);
        defaultFilename = 'attendance_report.xlsx';
      } else if (activeTab === 'quiz') {
        response = await teacherApi.exportQuizBlob(courseId);
        defaultFilename = 'quiz_performance_report.xlsx';
      } else if (activeTab === 'tasks') {
        response = await teacherApi.exportTaskBlob(courseId);
        defaultFilename = 'assignments_performance_report.xlsx';
      } else if (activeTab === 'activity') {
        response = await teacherApi.exportActivityBlob(courseId);
        defaultFilename = 'course_activity_audit_report.xlsx';
      }

      let filename = defaultFilename;
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

      toast.success('Spreadsheet export requested successfully!');
    } catch (err) {
      toast.error('Failed to download report.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-violet-400" />
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Generate and download production spreadsheets (openpyxl formatted) for your academic modules.
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
          <Button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-555 text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1 font-bold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-850 gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 cursor-pointer ${activeTab === 'attendance' ? 'text-violet-400 border-b-2 border-violet-500' : ''}`}
        >
          Attendance
        </button>
        <button 
          onClick={() => setActiveTab('quiz')}
          className={`pb-3 cursor-pointer ${activeTab === 'quiz' ? 'text-violet-400 border-b-2 border-violet-500' : ''}`}
        >
          Quiz performance
        </button>
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 cursor-pointer ${activeTab === 'tasks' ? 'text-violet-400 border-b-2 border-violet-500' : ''}`}
        >
          Assignments
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          className={`pb-3 cursor-pointer ${activeTab === 'activity' ? 'text-violet-400 border-b-2 border-violet-500' : ''}`}
        >
          Engagement Logs
        </button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm font-semibold text-slate-400">Compiling report analytics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'attendance' && attendanceData && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Present Marks</p>
                    <p className="text-xl font-bold text-slate-100 mt-1">{attendanceData.summary.total_present}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Absent Marks</p>
                    <p className="text-xl font-bold text-rose-400 mt-1">{attendanceData.summary.total_absent}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Average Attendance Rate</p>
                    <p className="text-xl font-bold text-emerald-450 mt-1">{attendanceData.summary.average_rate}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-455 bg-slate-900/40 uppercase tracking-wider font-bold">
                          <th className="p-4 pl-6">Student Name</th>
                          <th className="p-4">Assigned Course</th>
                          <th className="p-4 text-center">Present Sessions</th>
                          <th className="p-4 text-center">Absent Sessions</th>
                          <th className="p-4 pr-6 text-right">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {attendanceData.details.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/20 text-slate-300">
                            <td className="p-4 pl-6 font-bold text-slate-200">{row.student_name}</td>
                            <td className="p-4 text-slate-400">{row.courses}</td>
                            <td className="p-4 text-center font-semibold text-emerald-450">{row.present}</td>
                            <td className="p-4 text-center font-semibold text-rose-455">{row.absent}</td>
                            <td className="p-4 pr-6 text-right font-bold text-slate-100">{row.percentage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* TAB 2: QUIZ */}
          {activeTab === 'quiz' && quizData && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Quiz Attempts</p>
                    <p className="text-xl font-bold text-slate-100 mt-1">{quizData.summary.total_attempts}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Average Marks Percentage</p>
                    <p className="text-xl font-bold text-emerald-450 mt-1">{quizData.summary.average_percentage}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-455 bg-slate-900/40 uppercase tracking-wider font-bold">
                          <th className="p-4 pl-6">Quiz Title</th>
                          <th className="p-4">Student Name</th>
                          <th className="p-4 text-center">Score Obtained</th>
                          <th className="p-4 text-center">Total Marks</th>
                          <th className="p-4 pr-6 text-right">Performance Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {quizData.details.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/20 text-slate-350">
                            <td className="p-4 pl-6 font-bold text-slate-200">{row.quiz_title}</td>
                            <td className="p-4 text-slate-400">{row.student_name}</td>
                            <td className="p-4 text-center text-slate-100">{row.score}</td>
                            <td className="p-4 text-center text-slate-500">{row.total_marks}</td>
                            <td className="p-4 pr-6 text-right font-extrabold text-violet-400">{row.percentage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* TAB 3: TASKS */}
          {activeTab === 'tasks' && tasksData && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Task Submissions</p>
                    <p className="text-xl font-bold text-slate-100 mt-1">{tasksData.summary.total_submissions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Graded Submissions</p>
                    <p className="text-xl font-bold text-emerald-450 mt-1">{tasksData.summary.graded_count}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Evaluation</p>
                    <p className="text-xl font-bold text-amber-450 mt-1">{tasksData.summary.pending_count}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-455 bg-slate-900/40 uppercase tracking-wider font-bold">
                          <th className="p-4 pl-6">Assignment Title</th>
                          <th className="p-4">Student Name</th>
                          <th className="p-4">Submitted Date</th>
                          <th className="p-4 text-center">On-Time Status</th>
                          <th className="p-4 pr-6 text-right">Awarded Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {tasksData.details.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/20 text-slate-350">
                            <td className="p-4 pl-6 font-bold text-slate-200">{row.task_title}</td>
                            <td className="p-4 text-slate-400">{row.student_name}</td>
                            <td className="p-4 text-slate-500">{row.submitted_date}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                row.late === 'On Time' ? 'bg-emerald-950 text-emerald-450' : 'bg-rose-950 text-rose-455'
                              }`}>
                                {row.late}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right font-extrabold text-violet-400">{row.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* TAB 4: ENGAGEMENT LOGS */}
          {activeTab === 'activity' && activityData && (
            <>
              <div className="grid gap-4 md:grid-cols-1">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Course Activity Actions</p>
                    <p className="text-xl font-bold text-slate-100 mt-1">{activityData.summary.total_activities}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-455 bg-slate-900/40 uppercase tracking-wider font-bold">
                          <th className="p-4 pl-6">Student Name</th>
                          <th className="p-4">Course</th>
                          <th className="p-4">Activity action</th>
                          <th className="p-4">Detailed Description</th>
                          <th className="p-4 pr-6 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {activityData.details.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/20 text-slate-350">
                            <td className="p-4 pl-6 font-bold text-slate-200">{row.student_name}</td>
                            <td className="p-4 text-slate-400">{row.course_title}</td>
                            <td className="p-4 text-slate-300 font-bold uppercase tracking-wider text-[10px]">{row.action}</td>
                            <td className="p-4 text-slate-500 italic">"{row.detail}"</td>
                            <td className="p-4 pr-6 text-right text-slate-550">{row.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};
export default Reports;
