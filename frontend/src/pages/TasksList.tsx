import React, { useState, useEffect } from 'react';
import { Calendar, Search, Upload, Edit2, Trash2, CheckCircle2, FileText, Paperclip, Clock, Download } from 'lucide-react';
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

interface TaskAttachment {
  id: number;
  file_name: string;
  file_url: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_title: string;
  batch_id: number | null;
  batch_name: string;
  deadline: string;
  status: string;
  created_at: string;
  attachments: TaskAttachment[];
}

export const TasksList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const { success, error: showError } = useToast();

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('published');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
      setUiState('loading');
      try {
          // In a real app we might fetch batches per course, here we just fetch all available for mapping
          const [tskRes, curRes] = await Promise.all([
              api.get('/institute-admin/tasks'),
              api.get('/institute-admin/courses')
          ]);
          setTasks(tskRes.data);
          setCourses(curRes.data);
          
          if (tskRes.data.length === 0) setUiState('empty');
          else setUiState('normal');
      } catch (err) {
          console.error(err);
          showError('Failed to load tasks');
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // Filter lists
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteConfirm = async () => {
    if (selectedTask) {
      try {
          await api.delete(`/institute-admin/tasks/${selectedTask.id}`);
          fetchData();
          success('Task deleted successfully');
      } catch (err) {
          showError('Failed to delete task');
      }
      setIsDeleteOpen(false);
      setSelectedTask(null);
    }
  };

  const openCreateForm = () => {
    setIsEdit(false);
    setSelectedTask(null);
    setTitle('');
    setDescription('');
    setCourseId('');
    setBatchId('');
    
    // Set default deadline to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    setDeadline(tomorrow.toISOString().slice(0, 16));
    
    setStatus('published');
    setFiles([]);
    setIsFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setIsEdit(true);
    setSelectedTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCourseId(task.course_id.toString());
    setBatchId(task.batch_id ? task.batch_id.toString() : '');
    
    // Format date for datetime-local input
    const dateObj = new Date(task.deadline);
    dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
    setDeadline(dateObj.toISOString().slice(0, 16));
    
    setStatus(task.status);
    setFiles([]); // Require re-upload if they want to change files
    setIsFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setFiles(Array.from(e.target.files));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courseId || !deadline) {
        showError("Title, Course, and Deadline are required.");
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('course_id', courseId);
    if (batchId) formData.append('batch_id', batchId);
    formData.append('description', description);
    formData.append('deadline', new Date(deadline).toISOString());
    formData.append('status', status);
    
    files.forEach(file => {
        formData.append('files', file);
    });

    try {
        if (isEdit && selectedTask) {
            await api.put(`/institute-admin/tasks/${selectedTask.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            await api.post('/institute-admin/tasks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        setIsFormOpen(false);
        success(`Task ${isEdit ? 'updated' : 'created'} successfully`);
        fetchData();
    } catch (e) {
        showError("Failed to save task.");
    } finally {
        setIsSubmitting(false);
    }
  };

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
  } = usePagination({ data: filteredTasks, itemsPerPage: 10 });

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Manage Tasks" description="Assign and track student coursework." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Tasks' }]} />} />
        <LoadingState message="Loading tasks database..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Manage Tasks" description="Assign and track student coursework." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Tasks' }]} />} />
        <ErrorState title="Failed to load tasks" message="Could not fetch tasks from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Manage Academic Tasks"
          description="Create assignments, set deadlines, and attach instruction files for students."
          breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Manage Tasks' }]} />}
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="h-4 w-4" />}
              onClick={openCreateForm}
            >
              Create New Task
            </Button>
          }
        />
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Tasks</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search assignments by title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 w-full md:w-auto md:min-w-[200px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No Tasks Found"
          description="You have not created any assignments or homework tasks."
          actionLabel="Create Task"
          onActionClick={openCreateForm}
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Task Title</TableHeaderCell>
                <TableHeaderCell>Course & Batch</TableHeaderCell>
                <TableHeaderCell>Deadline</TableHeaderCell>
                <TableHeaderCell>Attachments</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map(t => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{t.title}</span>
                      <span className="text-xs text-slate-500 max-w-[280px] truncate">{t.description}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-medium text-xs">{courses.find(c => c.id === t.course_id)?.title || 'All Courses'}</span>
                    <span className="text-[10px] text-slate-500">Batch #{t.batch_id || 'All'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-slate-300">
                    {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No Deadline'}
                  </span>
                </TableCell>
                <TableCell>
                  {t.attachments && t.attachments.length > 0 ? (
                    <a href={`http://localhost:8000${t.attachments[0].file_url}`} target="_blank" rel="noreferrer" className="text-indigo-400 text-xs hover:underline flex items-center gap-1">
                      <Download className="w-3 h-3" /> {t.attachments[0].file_name || 'View File'}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-600 italic">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={t.status === 'published' ? 'success' : 'neutral'}>
                    {t.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditForm(t)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(t);
                        setIsDeleteOpen(true);
                      }}
                    >
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
      )}

      {/* Delete confirm */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete task "${selectedTask?.title}"? All student submissions and grades tied to this task will be permanently removed.`}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />

      {/* Task Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEdit ? "Edit Task / Assignment" : "Create New Task"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Task Title <span className="text-red-500">*</span></label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Week 1 React Project"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Instructions / Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide detailed instructions for the assignment..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
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
                <label className="text-xs font-semibold text-slate-300">Target Batch (Optional)</label>
                <Select value={batchId} onChange={e => setBatchId(e.target.value)}>
                    <option value="">-- All Batches --</option>
                    {/* Simplified for demo, ordinarily fetched based on course selection */}
                </Select>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Submission Deadline <span className="text-red-500">*</span></label>
                 <Input 
                    type="datetime-local" 
                    value={deadline} 
                    onChange={e => setDeadline(e.target.value)} 
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Status</label>
                 <Select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                 </Select>
              </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Resource Attachments {isEdit ? "(Optional, replaces existing files)" : ""}</label>
            <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-800 border-dashed rounded-lg cursor-pointer bg-slate-950 hover:bg-slate-900">
                    <div className="flex flex-col items-center justify-center pt-3 pb-4">
                        <Upload className="w-6 h-6 mb-2 text-slate-500" />
                        <p className="text-xs text-slate-500">{files.length > 0 ? `${files.length} file(s) selected` : "Click to attach instruction files (PDF, DOCX, ZIP)"}</p>
                    </div>
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>
            </div>
            {isEdit && selectedTask && selectedTask.attachments.length > 0 && files.length === 0 && (
                <div className="text-[10px] text-slate-500 pt-1">
                    Currently attached: {selectedTask.attachments.map(a => a.file_name).join(', ')}
                </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksList;
