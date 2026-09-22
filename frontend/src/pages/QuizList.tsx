import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, HelpCircle, Clock, Award, BookOpen } from 'lucide-react';
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

interface Quiz {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_title: string;
  batch_id: number | null;
  batch_name: string;
  duration_minutes: number;
  total_marks: number;
  status: string;
  question_count: number;
  created_at?: string;
}

export const QuizList: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const { success, error: showError } = useToast();

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalMarks, setTotalMarks] = useState(100);
  const [status, setStatus] = useState('published');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setUiState('loading');
    try {
      const [quizRes, coursesRes] = await Promise.all([
        api.get('/institute-admin/quizzes'),
        api.get('/institute-admin/courses')
      ]);
      setQuizzes(quizRes.data || []);
      setCourses(coursesRes.data || []);
      
      if (!quizRes.data || quizRes.data.length === 0) {
        setUiState('empty');
      } else {
        setUiState('normal');
      }
    } catch (err: any) {
      console.error('Failed to load quizzes:', err);
      showError(err.response?.data?.detail || err.message || 'Failed to fetch quizzes');
      setUiState('error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setIsEdit(false);
    setSelectedQuiz(null);
    setTitle('');
    setDescription('');
    setCourseId(courses[0]?.id ? String(courses[0].id) : '');
    setDurationMinutes(30);
    setTotalMarks(100);
    setStatus('published');
    setIsFormOpen(true);
  };

  const openEditModal = (quiz: Quiz) => {
    setIsEdit(true);
    setSelectedQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description || '');
    setCourseId(String(quiz.course_id));
    setDurationMinutes(quiz.duration_minutes || 30);
    setTotalMarks(quiz.total_marks || 100);
    setStatus(quiz.status || 'published');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showError('Please enter a quiz title');
      return;
    }
    if (!courseId) {
      showError('Please select a course');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        course_id: Number(courseId),
        duration_minutes: Number(durationMinutes),
        total_marks: Number(totalMarks),
        status: status
      };

      if (isEdit && selectedQuiz) {
        await api.put(`/institute-admin/quizzes/${selectedQuiz.id}`, payload);
        success('Quiz updated successfully');
      } else {
        await api.post('/institute-admin/quizzes', payload);
        success('Quiz created successfully');
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.response?.data?.detail || err.message || 'Error saving quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuiz) return;
    try {
      await api.delete(`/institute-admin/quizzes/${selectedQuiz.id}`);
      success('Quiz deleted successfully');
      setIsDeleteOpen(false);
      fetchData();
    } catch (err: any) {
      showError(err.response?.data?.detail || err.message || 'Failed to delete quiz');
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.course_title && q.course_title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || q.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCourse = courseFilter === 'All' || String(q.course_id) === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

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
  } = usePagination({ data: filteredQuizzes, itemsPerPage: 10 });

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Institute Admin', path: '/institute-admin/dashboard' },
          { label: 'Learning Manager', path: '/institute-admin/learning-manager/quiz' },
          { label: 'Manage Exams' }
        ]}
      />

      <PageHeader
        title="Manage Exams"
        description="Create and oversee assessments, tests, and exams across all registered courses."
        actions={
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Exam
          </Button>
        }
      />

      {/* Control / Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 w-full gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search exams by title or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'closed', label: 'Closed' }
                ]}
              />
            </div>
            <div className="w-52">
              <Select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                options={[
                  { value: 'All', label: 'All Courses' },
                  ...courses.map(c => ({ value: String(c.id), label: c.title }))
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Content */}
      {uiState === 'loading' && <LoadingState message="Loading exams..." />}
      {uiState === 'error' && (
        <ErrorState
          title="Could not load exams"
          message="We encountered an issue fetching exams from the server."
          onRetry={fetchData}
        />
      )}
      {uiState === 'empty' && (
        <EmptyState
          icon={<HelpCircle className="h-6 w-6" />}
          title="No exams found"
          description="Create your first exam or test to begin assessing student performance and course mastery."
          actionLabel="Create Exam"
          onActionClick={openCreateModal}
        />
      )}

      {uiState === 'normal' && (
        <Card>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Exam Title</TableHeaderCell>
                  <TableHeaderCell>Course</TableHeaderCell>
                  <TableHeaderCell>Duration</TableHeaderCell>
                  <TableHeaderCell>Total Marks</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      No exams matching the current filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell className="font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>{quiz.title}</span>
                        </div>
                        {quiz.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{quiz.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{quiz.course_title || `Course ID: ${quiz.course_id}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{quiz.duration_minutes} mins</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          <span>{quiz.total_marks} pts</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            quiz.status === 'published'
                              ? 'success'
                              : quiz.status === 'draft'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {quiz.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(quiz)}
                            className="p-1 text-slate-300 hover:text-white"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedQuiz(quiz);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
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
          )}
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEdit ? 'Edit Exam' : 'Create New Exam'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Exam Title *
            </label>
            <Input
              required
              placeholder="e.g. Mid-term Assessment, Python Basics Final Exam"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Course *
            </label>
            <Select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              options={[
                { value: '', label: '-- Select Course --' },
                ...courses.map(c => ({ value: String(c.id), label: c.title }))
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Total Marks
              </label>
              <Input
                type="number"
                min={1}
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'published', label: 'Published (Available to students)' },
                { value: 'draft', label: 'Draft' },
                { value: 'closed', label: 'Closed' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description / Instructions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide instructions or guidelines for this exam..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Exam' : 'Create Exam'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Exam"
        message={`Are you sure you want to delete "${selectedQuiz?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default QuizList;
