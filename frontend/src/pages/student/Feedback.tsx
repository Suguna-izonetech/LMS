import React, { useEffect, useState } from 'react';
import { LockKeyhole, MessageSquare, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { useToast } from '../../context/ToastContext';

interface FeedbackStatus {
  completed_lessons: number;
  total_lessons: number;
  progress_pct: number;
  feedback_unlocked: boolean;
  feedback_session_available: boolean;
  strict_mode: boolean;
}

export const StudentFeedback: React.FC = () => {
  const toast = useToast();
  const [status, setStatus] = useState<FeedbackStatus | null>(null);
  const [teacherMessage, setTeacherMessage] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/student/feedback/status');
      setStatus(response.data);
    } catch (error) {
      toast.error('Unable to load feedback access status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const submit = async (endpoint: string, message: string, strictMode = false) => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await api.post(endpoint, { message: message.trim(), strict_mode: strictMode });
      toast.success('Feedback submitted successfully.');
      if (endpoint.endsWith('/teacher')) setTeacherMessage('');
      else setAdminMessage('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !status) return <LoadingState message="Checking feedback access..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">Student Feedback</h1>
        <p className="text-sm text-slate-400">Share learning concerns with your teacher or, once unlocked, with the institute administration.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-sky-400" />Teacher Feedback</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-400">Use this space for worries, difficulties, questions, or feedback about your teacher and learning experience.</p>
          <textarea value={teacherMessage} onChange={(event) => setTeacherMessage(event.target.value)} rows={5} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500" placeholder="Describe your concern or feedback..." />
          <Button isLoading={submitting} onClick={() => submit('/student/feedback/teacher', teacherMessage)} className="bg-sky-600 hover:bg-sky-500">Send Teacher Feedback</Button>
        </CardContent>
      </Card>

      <Card className={!status.feedback_unlocked ? 'border-amber-500/20' : 'border-emerald-500/20'}>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base">{status.feedback_unlocked ? <ShieldCheck className="h-4 w-4 text-emerald-400" /> : <LockKeyhole className="h-4 w-4 text-amber-400" />}Institute Admin Feedback</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-400">Lesson completion: {status.completed_lessons} of {status.total_lessons} ({status.progress_pct}%).</p>
          {!status.feedback_unlocked ? (
            <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">Locked until you complete at least 30% of your required lessons.</p>
          ) : (
            <>
              {status.strict_mode && <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">Feedback Session is active in Strict Mode. Submit only feedback related to your learning experience and institute support.</p>}
              <textarea value={adminMessage} onChange={(event) => setAdminMessage(event.target.value)} rows={5} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500" placeholder="Share your institute-level concern or feedback..." />
              <Button isLoading={submitting} onClick={() => submit('/student/feedback/institute-admin', adminMessage, status.strict_mode)} className="bg-emerald-600 hover:bg-emerald-500">Submit Institute Admin Feedback</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFeedback;
