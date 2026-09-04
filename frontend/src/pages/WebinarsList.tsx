import React, { useState, useEffect } from 'react';
import { Calendar, Search, Edit2, Trash2, Video, Clock, Users, Link } from 'lucide-react';
import api from '../api/client';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  ConfirmationDialog,
  LoadingState,
  EmptyState,
  ErrorState,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Modal,
  Tabs,
  Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface Course {
  id: number;
  title: string;
}

interface Webinar {
  id: number;
  title: string;
  description: string;
  speaker_name: string;
  speaker_details: string;
  course_id: number;
  course_title: string;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  meeting_provider: string;
  meeting_url: string;
  status: string;
  created_at: string;
}

interface WebinarTableProps {
  data: Webinar[];
  onEdit: (w: Webinar) => void;
  onDelete: (w: Webinar) => void;
}

const WebinarTable: React.FC<WebinarTableProps> = ({ data, onEdit, onDelete }) => {
  const {
    paginatedData,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
    goToPage,
    nextPage,
    prevPage
  } = usePagination({ data, itemsPerPage: 10 });

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        No webinars match this category.
      </div>
    );
  }
  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Webinar Topic</TableHeaderCell>
            <TableHeaderCell>Speaker</TableHeaderCell>
            <TableHeaderCell>Timing</TableHeaderCell>
            <TableHeaderCell>Workspace</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map(w => (
            <TableRow key={w.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-indigo-400">
                    <Video className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{w.title}</span>
                    <span className="text-[10px] text-slate-500 max-w-[200px] truncate">{w.description}</span>
                    <span className="text-xs text-indigo-400/80 mt-1">{w.course_title}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-slate-300 font-medium text-sm">{w.speaker_name}</span>
                  <span className="text-slate-500 text-[10px]">{w.speaker_details}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-medium">{new Date(w.scheduled_date).toLocaleDateString()}</span>
                  </div>
                  {w.start_time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-xs font-medium">{new Date(w.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={w.status === 'live' ? 'success' : w.status === 'upcoming' ? 'info' : 'neutral'}>
                    {w.meeting_provider}
                  </Badge>
                  {w.meeting_url && w.status !== 'completed' && (
                    <a href={w.meeting_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                      <Link className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(w)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(w)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        onPageChange={goToPage}
        onNext={nextPage}
        onPrev={prevPage}
      />
    </TableContainer>
  );
};

export const WebinarsList: React.FC = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'concluded'>('upcoming');

  const [searchQuery, setSearchQuery] = useState('');
  const { success, error: showError } = useToast();

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerDetails, setSpeakerDetails] = useState('');
  const [courseId, setCourseId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingProvider, setMeetingProvider] = useState('zoom');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [webRes, curRes] = await Promise.all([
              api.get('/institute-admin/webinars'),
              api.get('/institute-admin/courses')
          ]);
          setWebinars(webRes.data);
          setCourses(curRes.data);
          
          if (webRes.data.length === 0) setUiState('empty');
          else setUiState('normal');
      } catch (err) {
          console.error(err);
          showError('Failed to load webinars');
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // Filter lists based on search
  const filteredWebinars = webinars.filter(w => {
    return w.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           w.speaker_name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const upcomingWebinars = filteredWebinars.filter(w => w.status === 'upcoming');
  const ongoingWebinars = filteredWebinars.filter(w => w.status === 'live');
  const concludedWebinars = filteredWebinars.filter(w => w.status === 'completed' || w.status === 'cancelled');

  const handleDeleteConfirm = async () => {
    if (selectedWebinar) {
      try {
          await api.delete(`/institute-admin/webinars/${selectedWebinar.id}`);
          fetchData();
          success('Webinar deleted successfully');
      } catch (err) {
          showError('Failed to delete webinar');
      }
      setIsDeleteOpen(false);
      setSelectedWebinar(null);
    }
  };

  const openCreateForm = () => {
    setIsEdit(false);
    setSelectedWebinar(null);
    setTitle('');
    setDescription('');
    setSpeakerName('');
    setSpeakerDetails('');
    setCourseId('');
    setMeetingProvider('zoom');
    setMeetingUrl('');
    
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    setScheduledDate(today.toISOString().slice(0, 16));
    setStartTime(today.toISOString().slice(0, 16));
    
    const later = new Date(today.getTime() + 60 * 60 * 1000); // +1 hour
    setEndTime(later.toISOString().slice(0, 16));
    
    setStatus('upcoming');
    setIsFormOpen(true);
  };

  const openEditForm = (web: Webinar) => {
    setIsEdit(true);
    setSelectedWebinar(web);
    setTitle(web.title);
    setDescription(web.description || '');
    setSpeakerName(web.speaker_name);
    setSpeakerDetails(web.speaker_details || '');
    setCourseId(web.course_id.toString());
    setMeetingProvider(web.meeting_provider || 'zoom');
    setMeetingUrl(web.meeting_url || '');
    
    // Format date for datetime-local input
    if (web.scheduled_date) {
        const sd = new Date(web.scheduled_date);
        sd.setMinutes(sd.getMinutes() - sd.getTimezoneOffset());
        setScheduledDate(sd.toISOString().slice(0, 16));
    }
    if (web.start_time) {
        const st = new Date(web.start_time);
        st.setMinutes(st.getMinutes() - st.getTimezoneOffset());
        setStartTime(st.toISOString().slice(0, 16));
    }
    if (web.end_time) {
        const et = new Date(web.end_time);
        et.setMinutes(et.getMinutes() - et.getTimezoneOffset());
        setEndTime(et.toISOString().slice(0, 16));
    }
    
    setStatus(web.status);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courseId || !speakerName || !scheduledDate) {
        showError("Title, Course, Speaker, and Date are required.");
        return;
    }

    setIsSubmitting(true);
    
    const payload = {
        title,
        description,
        speaker_name: speakerName,
        speaker_details: speakerDetails,
        course_id: parseInt(courseId),
        scheduled_date: new Date(scheduledDate).toISOString(),
        start_time: startTime ? new Date(startTime).toISOString() : null,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        meeting_provider: meetingProvider,
        meeting_url: meetingUrl,
        status
    };

    try {
        if (isEdit && selectedWebinar) {
            await api.put(`/institute-admin/webinars/${selectedWebinar.id}`, payload);
        } else {
            await api.post('/institute-admin/webinars', payload);
        }
        setIsFormOpen(false);
        success(`Webinar ${isEdit ? 'updated' : 'scheduled'} successfully`);
        fetchData();
    } catch (e) {
        showError("Failed to save webinar.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Webinars" description="Schedule online events." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Webinars' }]} />} />
        <LoadingState message="Loading events database..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Webinars" description="Schedule online events." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Webinars' }]} />} />
        <ErrorState title="Failed to load webinars" message="Could not fetch data from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Webinars & Events"
          description="Schedule and broadcast live speaker sessions to your courses."
          breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Webinars' }]} />}
          actions={
            <Button variant="primary" size="sm" leftIcon={<Video className="h-4 w-4" />} onClick={openCreateForm}>
              Schedule Webinar
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4 w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input placeholder="Search webinars..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          
          <Tabs
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as any)}
              items={[
                  { id: 'upcoming', label: `Upcoming Events (${upcomingWebinars.length})` },
                  { id: 'ongoing', label: `Ongoing / Live (${ongoingWebinars.length})` },
                  { id: 'concluded', label: `Concluded (${concludedWebinars.length})` }
              ]}
              className="w-full mb-4"
          />
          
          <div>
              {activeTab === 'upcoming' && (
                  <WebinarTable data={upcomingWebinars} onEdit={openEditForm} onDelete={(w) => { setSelectedWebinar(w); setIsDeleteOpen(true); }} />
              )}
              {activeTab === 'ongoing' && (
                  <WebinarTable data={ongoingWebinars} onEdit={openEditForm} onDelete={(w) => { setSelectedWebinar(w); setIsDeleteOpen(true); }} />
              )}
              {activeTab === 'concluded' && (
                  <WebinarTable data={concludedWebinars} onEdit={openEditForm} onDelete={(w) => { setSelectedWebinar(w); setIsDeleteOpen(true); }} />
              )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Cancel & Delete Webinar"
        message={`Are you sure you want to delete "${selectedWebinar?.title}"?`}
        confirmLabel="Confirm Delete"
        cancelLabel="Keep Event"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={isEdit ? "Edit Webinar" : "Schedule New Webinar"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Webinar Title <span className="text-red-500">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Masterclass on AI" />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Speaker Name <span className="text-red-500">*</span></label>
                <Input value={speakerName} onChange={e => setSpeakerName(e.target.value)} placeholder="e.g. Dr. John Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Speaker Details</label>
                <Input value={speakerDetails} onChange={e => setSpeakerDetails(e.target.value)} placeholder="e.g. Lead Engineer at TechCorp" />
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Target Course <span className="text-red-500">*</span></label>
                <Select value={courseId} onChange={e => setCourseId(e.target.value)}>
                    <option value="">-- Select Course --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Status</label>
                 <Select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live / Ongoing</option>
                    <option value="completed">Completed / Concluded</option>
                    <option value="cancelled">Cancelled</option>
                 </Select>
              </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Scheduled Date <span className="text-red-500">*</span></label>
                 <Input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Start Time</label>
                 <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">End Time</label>
                 <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Workspace / Provider</label>
                <Select value={meetingProvider} onChange={e => setMeetingProvider(e.target.value)}>
                    <option value="zoom">Zoom Meeting</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="custom">Custom URL</option>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                 <label className="text-xs font-semibold text-slate-300">Meeting Join URL</label>
                 <Input value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/j/123456" />
              </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Webinar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WebinarsList;
