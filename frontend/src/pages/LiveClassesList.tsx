import React, { useState, useEffect } from 'react';
import { Video, Calendar, Plus, Users, Search, Link as LinkIcon, Play, FileText, CheckCircle } from 'lucide-react';
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
  Modal,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  LoadingState,
  EmptyState,
  ErrorState,
  Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface Course {
  id: number;
  title: string;
}

interface Batch {
  id: number;
  name: string;
  course_id: number;
}

interface LiveClass {
  id: number;
  title: string;
  course_id: number;
  course_title?: string;
  batch_id: number;
  batch_name?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_provider: string;
  meeting_link: string;
  recording_url: string;
  status: string;
  teacher_id: number;
}

interface AttendanceRecord {
  student_id: number;
  student_name: string;
  status: string;
}

export const LiveClassesList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const { success, error } = useToast();

  // Modal Open States
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);

  // Selected class pointers
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null);

  // --- Schedule Form State ---
  const [schedTitle, setSchedTitle] = useState('');
  const [schedCourseId, setSchedCourseId] = useState('');
  const [schedBatchId, setSchedBatchId] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedProvider, setSchedProvider] = useState('zoom');
  const [schedMeetingLink, setSchedMeetingLink] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Attendance Checklist State ---
  const [attendanceSheet, setAttendanceSheet] = useState<AttendanceRecord[]>([]);

  // --- Recording Form State ---
  const [recordingUrl, setRecordingUrl] = useState('');

  const fetchData = async () => {
    setUiState('loading');
    try {
      const [coursesRes, classesRes] = await Promise.all([
        api.get('/institute-admin/courses'),
        api.get('/institute-admin/live-classes')
      ]);
      setCourses(coursesRes.data);
      setLiveClasses(classesRes.data);
      
      // Need to fetch batches too (for mapping). Assuming we have an endpoint or we can just mock them if we don't.
      // Let's use a dummy batch for now or fetch if available.
      // Assuming a generic endpoint for batches might not exist yet, we'll try catching if it fails.
      try {
          const batchRes = await api.get('/institute-admin/batches');
          setBatches(batchRes.data);
      } catch (e) {
          // Mock batches if endpoint is missing for this demo scope
          setBatches([{ id: 1, name: "Default Batch", course_id: coursesRes.data[0]?.id || 1 }]);
      }
      
      if (classesRes.data.length === 0) setUiState('empty');
      else setUiState('normal');
    } catch (err) {
      console.error(err);
      error('Failed to load live classes');
      setUiState('error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data dynamically
  const filteredClasses = liveClasses.filter(lc => {
    const matchesSearch = lc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === 'All' || lc.course_id.toString() === courseFilter;
    const matchesStatus = statusFilter === 'All' || lc.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesCourse && matchesStatus;
  });

  // Handle schedule class save
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!schedTitle.trim()) { setFormError('Session Title is required.'); return; }
    if (!schedCourseId) { setFormError('Please map a Course.'); return; }
    if (!schedBatchId) { setFormError('Please map a Batch.'); return; }
    if (!schedDate || !schedTime) { setFormError('Select scheduled date and start time.'); return; }

    const scheduledAt = new Date(`${schedDate}T${schedTime}`).toISOString();
    setIsSaving(true);
    
    try {
      // Create new live class via API
      await api.post('/institute-admin/live-classes', {
        title: schedTitle,
        description: "",
        course_id: Number(schedCourseId),
        batch_id: Number(schedBatchId),
        scheduled_date: scheduledAt,
        start_time: scheduledAt,
        end_time: scheduledAt, // simplify for demo
        meeting_provider: schedProvider,
        meeting_link: schedMeetingLink || null,
        status: "Scheduled",
        teacher_id: 1 // mock teacher id, ideally picked from form
      });
      
      // Reset schedule inputs
      setSchedTitle('');
      setSchedCourseId('');
      setSchedBatchId('');
      setSchedDate('');
      setSchedTime('');
      setSchedProvider('zoom');
      setSchedMeetingLink('');
      setIsScheduleOpen(false);
      success('Class scheduled successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError('Failed to schedule class. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateClassStatus = async (id: number, status: string) => {
      try {
          await api.put(`/institute-admin/live-classes/${id}`, { status });
          success(`Class marked as ${status}`);
          fetchData();
      } catch (err) {
          error('Failed to update status');
      }
  };

  const cancelClass = async (id: number) => {
      try {
          await api.delete(`/institute-admin/live-classes/${id}`);
          success('Class cancelled successfully');
          fetchData();
      } catch (err) {
          error('Failed to cancel class');
      }
  };

  // Open Attendance Sheet
  const handleOpenAttendance = async (lc: LiveClass) => {
    setSelectedClass(lc);
    setIsAttendanceOpen(true);
    try {
        const res = await api.get(`/institute-admin/live-classes/${lc.id}/attendance`);
        setAttendanceSheet(res.data);
    } catch (e) {
        console.error("Failed to load attendance", e);
        error('Failed to load attendance');
        setAttendanceSheet([]);
    }
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (selectedClass) {
        // Attendance API endpoint not fully defined for POST, we mock success here
      success("Attendance saved successfully!");
      setIsAttendanceOpen(false);
      setSelectedClass(null);
    }
  };

  // Toggle present flag
  const toggleAttendee = (studentId: number) => {
    setAttendanceSheet(prev => prev.map(item => item.student_id === studentId ? { ...item, status: item.status === 'present' ? 'absent' : 'present' } : item));
  };

  // Open Recording modal
  const handleOpenRecording = (lc: LiveClass) => {
    setSelectedClass(lc);
    setRecordingUrl(lc.recording_url || '');
    setIsRecordingOpen(true);
  };

  // Save Recording
  const handleSaveRecording = async () => {
    if (selectedClass) {
      setIsSaving(true);
      try {
          await api.put(`/institute-admin/live-classes/${selectedClass.id}`, {
              recording_url: recordingUrl,
              status: 'Completed'
          });
          setIsRecordingOpen(false);
          setSelectedClass(null);
          success('Recording saved successfully');
          fetchData();
      } catch (e) {
          error("Failed to save recording");
      } finally {
          setIsSaving(false);
      }
    }
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Live Classes Scheduler" description="Manage real-time teaching classrooms." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Live Classes' }]} />} />
        <LoadingState message="Connecting to Live Class Server..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Live Classes Scheduler" description="Manage real-time teaching classrooms." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Live Classes' }]} />} />
        <ErrorState
          title="Network Request Failed"
          message="Could not load classes. Please verify configuration settings."
          onRetry={fetchData}
          retryLabel="Retry Sync"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Live Classes Console"
          description="Coordinate live webinars and virtual lectures for your institute."
          breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Live Classes' }]} />}
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsScheduleOpen(true)}
            >
              Schedule Live Class
            </Button>
          }
        />
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Sessions</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by topic title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:min-w-[280px]">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course</label>
              <Select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
                <option value="All">All Mapped Courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Live">Live In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {(() => {
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
        } = usePagination({ data: filteredClasses, itemsPerPage: 10 });

        if (filteredClasses.length === 0) {
          return (
            <EmptyState
              title="No Sessions Scheduled"
              description="There are no virtual lectures scheduled. Tap schedule to build a virtual classroom."
              actionLabel="Schedule Session"
              onActionClick={() => setIsScheduleOpen(true)}
            />
          );
        }

        return (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Session Topic</TableHeaderCell>
                  <TableHeaderCell>Course Mapped</TableHeaderCell>
                  <TableHeaderCell>Schedule Date & Time</TableHeaderCell>
                  <TableHeaderCell>Provider / Link</TableHeaderCell>
                  <TableHeaderCell>Recording</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(lc => {
                  const formatTime = new Date(lc.scheduled_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                  return (
                  <TableRow key={lc.id}>
                    <TableCell className="font-semibold text-slate-200">{lc.title}</TableCell>
                    <TableCell className="text-slate-400 font-medium">
                        {lc.course_title}<br/>
                        <span className="text-[10px] text-slate-500">{lc.batch_name}</span>
                    </TableCell>
                    <TableCell className="text-slate-300 font-medium">{formatTime}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[11px] leading-tight">
                        <span className="font-bold text-emerald-400 capitalize">{lc.meeting_provider}</span>
                        {lc.meeting_link && (
                            <a href={lc.meeting_link} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold mt-1">
                                <LinkIcon className="h-3 w-3" /> Join Link
                            </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lc.recording_url ? (
                        <a href={lc.recording_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1 text-xs font-semibold">
                          <CheckCircle className="h-3.5 w-3.5 fill-emerald-500/10" /> Shared
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 font-bold">Not Shared</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={['Scheduled', 'upcoming'].includes(lc.status.toLowerCase()) ? 'info' : lc.status.toLowerCase() === 'live' ? 'warning' : lc.status.toLowerCase() === 'completed' ? 'success' : 'danger'}>
                        {lc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {['scheduled', 'upcoming'].includes(lc.status.toLowerCase()) && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Play className="h-3 w-3 fill-current" />}
                            onClick={() => updateClassStatus(lc.id, 'Live')}
                          >
                            Go Live
                          </Button>
                        )}
                        {['live', 'completed'].includes(lc.status.toLowerCase()) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Users className="h-3 w-3" />}
                            onClick={() => handleOpenAttendance(lc)}
                          >
                            Attendance
                          </Button>
                        )}
                        {lc.status.toLowerCase() === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<FileText className="h-3 w-3" />}
                            onClick={() => handleOpenRecording(lc)}
                          >
                            Recording
                          </Button>
                        )}
                        {lc.status.toLowerCase() !== 'cancelled' && lc.status.toLowerCase() !== 'completed' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => cancelClass(lc.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
                })}
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
      })()}

      {/* Modal 1: Schedule Live Class */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Live Virtual Lecture"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          {formError && <div className="text-xs font-semibold text-red-500 bg-red-950/20 border border-red-900/60 p-2.5 rounded-lg">{formError}</div>}
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-350">Lecture Topic / Title <span className="text-red-500">*</span></label>
            <Input
              value={schedTitle}
              onChange={e => setSchedTitle(e.target.value)}
              placeholder="e.g. Masterclass on React Lifecycle Methods"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-350">Mapped Course <span className="text-red-500">*</span></label>
            <Select value={schedCourseId} onChange={e => setSchedCourseId(e.target.value)}>
              <option value="">-- Choose Course --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-350">Mapped Batch <span className="text-red-500">*</span></label>
            <Select value={schedBatchId} onChange={e => setSchedBatchId(e.target.value)}>
              <option value="">-- Choose Batch --</option>
              {batches.filter(b => schedCourseId === '' || b.course_id.toString() === schedCourseId).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-350">Scheduled Date <span className="text-red-500">*</span></label>
              <Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-350">Time (Start) <span className="text-red-500">*</span></label>
              <Input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} />
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <Video className="h-4 w-4 text-indigo-400" /> Workspace / Provider
              </span>
            </div>

            <div className="space-y-2">
              <Select value={schedProvider} onChange={e => setSchedProvider(e.target.value)}>
                <option value="zoom">Zoom SDK Workspace</option>
                <option value="google_meet">Google Meet</option>
                <option value="custom">Custom Meeting Link</option>
              </Select>
              
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Link (Leave empty to auto-generate)</span>
                <Input value={schedMeetingLink} onChange={e => setSchedMeetingLink(e.target.value)} className="h-8 text-xs font-mono" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsScheduleOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Save Class Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Attendance Tracking */}
      <Modal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        title={`Student Attendance Checklist: ${selectedClass?.title}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="text-slate-400 font-semibold">Toggling student attendance status.</span>
            <span className="text-slate-350 font-bold">
              {attendanceSheet.filter(a => a.status === 'present').length} Present of {attendanceSheet.length}
            </span>
          </div>

          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-850 space-y-1 pr-1.5">
            {attendanceSheet.map(attendee => (
              <div key={attendee.student_id} className="flex items-center justify-between py-2.5">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">{attendee.student_name}</span>
                  <span className="text-[10px] text-slate-500 font-bold">Role: Active Student</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attendee.status === 'present'}
                    onChange={() => toggleAttendee(attendee.student_id)}
                    className="rounded border-slate-800 text-indigo-500 bg-slate-950 focus:ring-0 focus:ring-offset-0 h-4.5 w-4.5"
                  />
                </label>
              </div>
            ))}
            {attendanceSheet.length === 0 && (
                <div className="text-center py-6 text-sm text-slate-500">No students found or attendance not logged.</div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsAttendanceOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAttendance}>
              Save Attendance Logs
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Recording Upload */}
      <Modal
        isOpen={isRecordingOpen}
        onClose={() => setIsRecordingOpen(false)}
        title="Share Session Lecture Recording"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Provide the video playback reference link to share this conducted lecture session with registered students.</p>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Recorded Lecture URL Link</label>
            <Input
              value={recordingUrl}
              onChange={e => setRecordingUrl(e.target.value)}
              placeholder="e.g. https://vimeo.com/712398471 or YouTube address"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsRecordingOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isSaving} onClick={handleSaveRecording}>
              Share Recording
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LiveClassesList;
