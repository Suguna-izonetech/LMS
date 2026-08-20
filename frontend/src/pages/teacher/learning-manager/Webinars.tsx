import React, { useEffect, useState } from 'react';
import { Presentation, Plus, Calendar, ArrowRight, Trash2, X, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../context/ToastContext';
import { teacherApi } from '../../../api/teacher';

export const Webinars: React.FC = () => {
  const toast = useToast();
  const [webinars, setWebinars] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [webRes, coursesRes] = await Promise.all([
        teacherApi.getWebinars(),
        teacherApi.getCourses()
      ]);
      setWebinars(webRes);
      setCourses(coursesRes);
      if (coursesRes.length > 0) {
        setSelectedCourseId(String(coursesRes[0].id));
      }
    } catch (err) {
      toast.error('Failed to load webinars list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !speakerName || !dateTime || !selectedCourseId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      await teacherApi.createWebinar({
        title,
        description,
        speaker_name: speakerName,
        course_id: Number(selectedCourseId),
        scheduled_date: new Date(dateTime).toISOString(),
        meeting_url: meetingUrl
      });
      toast.success('Webinar scheduled successfully!');
      setTitle('');
      setDescription('');
      setSpeakerName('');
      setDateTime('');
      setMeetingUrl('');
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error('Failed to schedule webinar.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this webinar?')) return;
    try {
      await teacherApi.deleteWebinar(id);
      toast.success('Webinar cancelled and deleted.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete webinar.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading masterclass streams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Webinars
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Schedule and broadcast masterclasses, seminars, and guest presentations.
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-violet-650 hover:bg-violet-550 cursor-pointer flex items-center gap-1.5"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showAddForm ? 'Cancel' : 'Schedule Webinar'}</span>
        </Button>
      </div>

      {showAddForm && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Schedule Masterclass Seminar</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleCreateWebinar} className="space-y-4">
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
                  <label className="text-xs font-semibold text-slate-400">Webinar Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. LLM Architectures" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Speaker Name</label>
                  <Input value={speakerName} onChange={(e) => setSpeakerName(e.target.value)} placeholder="Guest Speaker or Professor" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Date & Time</label>
                  <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Synopsis of the masterclass" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Stream or Meeting URL</label>
                <Input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/... or YouTube Live" />
              </div>

              <Button type="submit" className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer mt-2">
                Schedule Stream
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {webinars.map((web) => (
          <Card key={web.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                web.status === 'upcoming' ? 'bg-violet-950 text-violet-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {web.status}
              </span>
              <Presentation className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider block mb-1">
                  {web.course_title}
                </span>
                <h3 className="text-sm font-bold text-slate-200 line-clamp-1">{web.title}</h3>
                <p className="text-xs text-slate-500 font-medium">By {web.speaker_name}</p>
                <p className="text-xs text-slate-550 mt-1 italic line-clamp-2">{web.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-850 py-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-violet-400" />
                  <span>{new Date(web.scheduled_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-550">
                  {new Date(web.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(web.id)}
                  className="text-rose-450 hover:text-rose-350 p-0 hover:bg-transparent"
                >
                  Cancel
                </Button>
                {web.meeting_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(web.meeting_url, '_blank')}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 p-0 cursor-pointer hover:bg-transparent"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>Enter Lobby</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default Webinars;
