import React, { useEffect, useState } from 'react';
import { CheckSquare, Calendar, Download, Upload, CheckCircle2, FileText, Clock } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { useToast } from '../../context/ToastContext';

interface TaskAttachment {
  id: number;
  file_name: string;
  file_url: string;
}

interface TaskItem {
  id: number;
  title: string;
  description: string;
  course_title: string;
  deadline: string;
  attachments: TaskAttachment[];
  submitted: boolean;
  submission_status: string;
  submission_file: string | null;
  feedback: string | null;
}

export const Tasks: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching student tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmissionModal = (task: TaskItem) => {
    setActiveTask(task);
    setSubmissionUrl(task.submission_file || '');
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !submissionUrl) return;

    setSubmitting(true);
    try {
      await api.post(`/student/tasks/${activeTask.id}/submit`, {
        file_url: submissionUrl
      });
      toast.success('Assignment solution submitted successfully!');
      setActiveTask(null);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to submit assignment solution.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your task assignments..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          Tasks & Assignments
        </h1>
        <p className="text-sm text-slate-400">
          Review assignment instructions, download resources, and submit your work before the deadline.
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => {
          const deadlineDate = new Date(task.deadline);
          return (
            <Card key={task.id} className="hover:border-sky-500/40 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[11px] font-bold uppercase">
                      {task.course_title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      task.submitted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {task.submitted ? 'Submitted' : 'Pending Submission'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Deadline: {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-100">{task.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{task.description}</p>
                </div>

                {/* Attachments */}
                {task.attachments && task.attachments.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="text-xs font-bold text-slate-300">Task Attachments / Handouts:</p>
                    <div className="flex flex-wrap gap-2">
                      {task.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-sky-400 hover:bg-slate-800 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>{att.file_name}</span>
                          <Download className="h-3 w-3 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission status & action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-900">
                  {task.submitted ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Submitted Solution: {task.submission_file}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No submission uploaded yet</span>
                  )}

                  <Button
                    onClick={() => handleOpenSubmissionModal(task)}
                    className="bg-sky-600 hover:bg-sky-500 shadow-sm cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    <span>{task.submitted ? 'Resubmit Solution' : 'Submit Solution'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submission Modal Dialog */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border-sky-900/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Submit Assignment Solution</CardTitle>
              <CardDescription>{activeTask.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <Input
                  label="Solution File Link / Artifact URL"
                  placeholder="https://github.com/myrepo or /uploads/my_assignment.pdf"
                  required
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                />

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                  <Button type="button" variant="ghost" onClick={() => setActiveTask(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={submitting} className="bg-sky-600 hover:bg-sky-500 cursor-pointer">
                    Submit Solution
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default Tasks;
