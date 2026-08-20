import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
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
  Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  course_type: string;
  visibility: string;
  status: string;
  thumbnail_url: string;
  active_batches_count: number;
}

export const CoursesList: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Component local states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [visibilityFilter, setVisibilityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const { success, error } = useToast();

  // Confirmation modal state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchCourses = async () => {
    setUiState('loading');
    try {
      const res = await api.get('/institute-admin/courses');
      setCourses(res.data);
      if (res.data.length === 0) setUiState('empty');
      else setUiState('normal');
    } catch (err) {
      console.error(err);
      error('Failed to load courses');
      setUiState('error');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Sorting / Filtering data
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || c.course_type === typeFilter;
    const matchesVisibility = visibilityFilter === 'All' || c.visibility === visibilityFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesType && matchesVisibility && matchesStatus;
  });

  // Must be called at top level — before any conditional returns
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
  } = usePagination({ data: filteredCourses, itemsPerPage: 10 });

  const handleDeleteConfirm = async () => {
    if (selectedCourse) {
      try {
        await api.delete(`/institute-admin/courses/${selectedCourse.id}`);
        setIsDeleteOpen(false);
        setSelectedCourse(null);
        fetchCourses(); // refresh
        success('Course deleted successfully');
      } catch (err) {
        console.error(err);
        error('Failed to delete course');
      }
    }
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Course List" description="Manage and organize your courses." breadcrumbs={<Breadcrumb items={[{ label: 'Courses' }]} />} />
        <LoadingState message="Fetching core courses database records..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Course List" description="Manage and organize your courses." breadcrumbs={<Breadcrumb items={[{ label: 'Courses' }]} />} />
        <ErrorState
          title="Courses Load Failure"
          message="Could not load academic course structures from the server."
          onRetry={fetchCourses}
          retryLabel="Retry"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Courses Catalog"
          description="Build, organize, and inspect educational courses mapped to your system."
          breadcrumbs={<Breadcrumb items={[{ label: 'Courses' }]} />}
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/institute-admin/courses/create')}
            >
              Create Course
            </Button>
          }
        />
      </div>

      {/* Filters Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Courses</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by title, description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:min-w-[420px]">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</label>
              <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="All">All Types</option>
                <option value="Live">Live</option>
                <option value="Prerecorded">Prerecorded</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Offline">Offline</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visibility</label>
              <Select value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value)}>
                <option value="All">All Visibilities</option>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
                <option value="Unlisted">Unlisted</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main List */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          title="No Courses Found"
          description={searchQuery || typeFilter !== 'All' ? "Your filters did not match any course." : "There are no courses loaded in the system."}
          actionLabel={searchQuery || typeFilter !== 'All' ? "Reset Filters" : "Add Course"}
          onActionClick={searchQuery || typeFilter !== 'All' ? () => { setSearchQuery(''); setTypeFilter('All'); setVisibilityFilter('All'); setStatusFilter('All'); } : () => navigate('/institute-admin/courses/create')}
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
            <TableRow>
              <TableHeaderCell>Course Title & Code</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Visibility</TableHeaderCell>
              <TableHeaderCell>Active Batches</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map(course => (
              <TableRow key={course.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={course.thumbnail_url ? `http://localhost:8000${course.thumbnail_url}` : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&q=80'}
                      alt={course.title}
                      className="w-12 h-12 rounded-md object-cover border border-slate-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&q=80';
                      }}
                    />
                    <div className="flex flex-col max-w-[280px]">
                      <span className="font-semibold text-slate-200 truncate">{course.title}</span>
                      <span className="text-xs text-slate-500 truncate font-mono">{course.code}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={course.course_type === 'Live' ? 'success' : course.course_type === 'Prerecorded' ? 'info' : 'warning'}>
                    {course.course_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300 font-medium">{course.visibility}</TableCell>
                <TableCell className="text-slate-400 font-medium">{course.active_batches_count}</TableCell>
                <TableCell>
                  <Badge variant={course.status === 'Published' || course.status === 'Active' ? 'success' : 'warning'}>
                    {course.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/institute-admin/courses/${course.id}/edit`)}
                      title="Edit Course"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsDeleteOpen(true);
                      }}
                      title="Delete Course"
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

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Confirm Course Deletion"
        message={`Are you absolutely sure you want to delete course "${selectedCourse?.title}"? All mapped modules, books, and class materials may become orphaned. This action is irreversible.`}
        confirmLabel="Yes, Delete Course"
        cancelLabel="No, Keep It"
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedCourse(null);
        }}
        variant="danger"
      />
    </div>
  );
};

export default CoursesList;
