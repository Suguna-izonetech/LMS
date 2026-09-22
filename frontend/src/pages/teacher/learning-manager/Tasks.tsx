import React, { useEffect, useState } from 'react';
import { ClipboardList, Plus, ArrowRight, ArrowLeft, RefreshCw, Trash2, X, Upload, Download, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../context/ToastContext';
import { teacherApi } from '../../../api/teacher';

export const Tasks: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Selected Task details for grading queue
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Grading Form State
  const [activeSubmissionId, setActiveSubmissionId] = useState<number | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, coursesRes] = await Promise.all([
        teacherApi.getTasks(),
        teacherApi.getCourses()
      ]);
      setTasks(tasksRes);
      setCourses(coursesRes);
      if (coursesRes.length > 0) {
        setSelectedCourseId(String(coursesRes[0].id));
      }
    } catch (err) {
      toast.error('Failed to load assignments list.');
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
          setBatches(detail.batches || []);
          if (detail.batches && detail.batches.length > 0) {
            setSelectedBatchId(String(detail.batches[0].id));
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await teacherApi.uploadFile(file);
      setAttachmentUrls(prev => [...prev, res.file_url]);
      toast.success('Assignment reference file uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || !selectedCourseId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      await teacherApi.createTask({
        title,
        description,
        course_id: Number(selectedCourseId),
        batch_id: selectedBatchId ? Number(selectedBatchId) : null,
        deadline: new Date(deadline).toISOString(),
        attachment_urls: attachmentUrls
      });
      toast.success('Assignment published successfully!');
      setTitle('');
      setDescription('');
      setDeadline('');
      setAttachmentUrls([]);
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error('Failed to publish assignment.');
    }
  };

  const handleOpenGradingQueue = async (id: number) => {
    try {
      setSubmissionsLoading(true);
      setSelectedTaskId(id);
      const [details, subs] = await Promise.all([
        teacherApi.getTask(id),
        teacherApi.getTaskSubmissions(id)
      ]);
      setTaskDetails(details);
      setSubmissions(subs);
    } catch (err) {
      toast.error('Failed to load submissions queue.');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionId || !grade) {
      toast.error('Please input a grade.');
      return;
    }
    try {
      await teacherApi.gradeSubmission(activeSubmissionId, { grade, feedback });
      toast.success('Submission graded successfully!');
      setGrade('');
      setFeedback('');
      setActiveSubmissionId(null);
      if (selectedTaskId) {
        handleOpenGradingQueue(selectedTaskId);
      }
    } catch (err) {
      toast.error('Failed to submit grade.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await teacherApi.deleteTask(id);
      toast.success('Assignment deleted.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete assignment.');
    }
  };

  if (loading || submissionsLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading assignments workspace...</p>
      </div>
    );
  }

  // --- SUBVIEW: SUBMISSIONS GRADING QUEUE ---
  if (selectedTaskId && taskDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSelectedTaskId(null); loadData(); }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Assignments</span>
          </Button>
        </div>

        <div className="border-b border-slate-850 pb-5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">{taskDetails.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{taskDetails.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span>Deadline: <strong className="text-slate-350">{new Date(taskDetails.deadline).toLocaleDateString()}</strong></span>
            {taskDetails.attachments && taskDetails.attachments.length > 0 && (
              <div className="flex items-center gap-2">
                <span>Attachments:</span>
                {taskDetails.attachments.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => window.open(`http://localhost:8000${a.file_url}`, '_blank')}
                    className="text-violet-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>{a.file_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Submissions Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-455 uppercase tracking-wider bg-slate-900/40 font-bold">
                        <th className="p-4 pl-6">Student Name</th>
                        <th className="p-4">Submission File</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Grade</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-550">No submissions uploaded for this task.</td>
                        </tr>
                      ) : (
                        submissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-900/20 text-slate-300">
                            <td className="p-4 pl-6 font-bold text-slate-200">{sub.student_name}</td>
                            <td className="p-4">
                              {sub.file_url ? (
                                <button
                                  onClick={() => window.open(`http://localhost:8000${sub.file_url}`, '_blank')}
                                  className="text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>View Upload</span>
                                </button>
                              ) : 'N/A'}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                sub.status === 'graded' ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/20' : 'bg-rose-950 text-rose-450 border border-rose-900/20'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="p-4 text-center font-bold text-slate-200">{sub.grade || 'N/A'}</td>
                            <td className="p-4 pr-6 text-right">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveSubmissionId(sub.id);
                                  setGrade(sub.grade || '');
                                  setFeedback(sub.feedback || '');
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-xs px-3"
                              >
                                Grade
                              </Button>
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

          {/* Grading Composer */}
          <div className="lg:col-span-1">
            {activeSubmissionId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Grading Composer</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleGradeSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Score / Grade (e.g. A, B+, 95/100)</label>
                      <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Enter grade label" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Teacher Feedback</label>
                      <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Write performance critique" />
                    </div>
                    <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-550">
                      Save Grade
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                Select a submission from the list to grade it.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN VIEW: ASSIGNMENTS GRID ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Tasks & Assignments
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Publish assignment prompts, manage grading queues, and track submissions.
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-violet-650 hover:bg-violet-550 cursor-pointer flex items-center gap-1.5"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showAddForm ? 'Cancel' : 'New Assignment'}</span>
        </Button>
      </div>

      {showAddForm && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Create New Assignment</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Course Mapping</label>
                  <Select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    options={courses.map(c => ({ value: String(c.id), label: c.title }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Batch Mapping (Optional)</label>
                  <Select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    options={[
                      { value: '', label: 'All Batches' },
                      ...batches.map(b => ({ value: String(b.id), label: b.name }))
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Assignment Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Final Project Milestone 1" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Instructions Prompt</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Outline instructions, criteria or resources" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Deadline Date & Time</label>
                <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Attach Reference Material</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 cursor-pointer text-xs font-semibold text-slate-350">
                    <Upload className="h-4 w-4 text-violet-400" />
                    <span>Upload Handout</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {uploading && <RefreshCw className="h-4 w-4 animate-spin text-violet-500" />}
                  {attachmentUrls.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {attachmentUrls.map((url, i) => (
                        <span key={i} className="text-xs text-emerald-450 font-bold truncate max-w-xs">{url}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer mt-2">
                Publish Assignment
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No assignments created</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Publish assignments and project tasks, manage deadlines, and review student grading queues.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-[10px] font-bold text-violet-400 bg-violet-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {task.course_title}
                </span>
                <ClipboardList className="h-4 w-4 text-violet-400" />
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 line-clamp-1">{task.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase mt-1 bg-slate-800 text-slate-400">
                    {task.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-850">
                  <Button
                    onClick={() => handleDeleteTask(task.id)}
                    variant="ghost"
                    size="sm"
                    className="text-rose-450 hover:text-rose-350 p-0 hover:bg-transparent"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenGradingQueue(task.id)}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 p-0 cursor-pointer hover:bg-transparent"
                  >
                    <span>Grade Queue</span>
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
export default Tasks;
