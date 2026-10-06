import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, UserPlus, Check, UserCheck, Loader2, X, Users } from 'lucide-react';
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
  Pagination,
  Modal,
  ModalBody,
  ModalFooter
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

export interface Teacher {
  id: number;
  name?: string;
  username: string;
  email: string;
  phone?: string;
  profile_image_url?: string | null;
  is_active?: boolean;
  assigned_courses_count?: number;
}

export interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  course_type: string;
  visibility: string;
  status: string;
  thumbnail_url: string;
  active_batches_count: number;
  teachers?: Teacher[];
  duration?: string;
  start_date?: string;
  price?: number;
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

  // Assign Teacher Modal State - Supports Multiple Teachers
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState<Course | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isSavingAssign, setIsSavingAssign] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string>('Could not load academic course structures from the server.');

  const fetchCourses = async () => {
    setUiState('loading');
    try {
      const res = await api.get('/institute-admin/courses');
      setCourses(res.data);
      if (res.data.length === 0) setUiState('empty');
      else setUiState('normal');
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setErrorMessage('Access Denied (403): Your current session does not have Institute Admin or Teacher privileges. Please sign in with an authorized Institute Admin account.');
        error('Access denied. Please log in with an authorized Institute Admin account.');
      } else {
        setErrorMessage(err.response?.data?.detail || 'Could not load academic course structures from the server.');
        error('Failed to load courses');
      }
      setUiState('error');
    }
  };

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const res = await api.get('/institute-admin/teachers');
      setTeachers(res.data);
    } catch (err: any) {
      console.error('Failed to load teachers:', err);
      error('Could not load faculty list from the server.');
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  // Filter courses
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || c.course_type === typeFilter;
    const matchesVisibility = visibilityFilter === 'All' || c.visibility === visibilityFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesType && matchesVisibility && matchesStatus;
  });

  // Filter teachers for assign scrollbox
  const filteredTeachers = teachers.filter(t => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return true;
    return (t.name || '').toLowerCase().includes(q) ||
           t.username.toLowerCase().includes(q) ||
           t.email.toLowerCase().includes(q);
  });

  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCourse) return;
    try {
      await api.delete(`/institute-admin/courses/${selectedCourse.id}`);
      success(`Course "${selectedCourse.title}" removed successfully.`);
      fetchCourses();
    } catch (err) {
      console.error(err);
      error('Failed to delete course');
    } finally {
      setIsDeleteOpen(false);
      setSelectedCourse(null);
    }
  };

  // Open Assign Teacher Modal
  const handleOpenAssignModal = (course: Course) => {
    setCourseToAssign(course);
    const existingIds = (course.teachers && course.teachers.length > 0)
      ? course.teachers.map(t => t.id)
      : [];
    setSelectedTeacherIds(existingIds);
    setTeacherSearch('');
    setIsAssignModalOpen(true);
    if (teachers.length === 0) {
      fetchTeachers();
    }
  };

  // Toggle individual teacher selection
  const toggleTeacherSelection = (teacherId: number) => {
    setSelectedTeacherIds(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  // Select all currently filtered teachers
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredTeachers.map(t => t.id);
    setSelectedTeacherIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  // Deselect all currently filtered teachers
  const handleDeselectAllFiltered = () => {
    const filteredSet = new Set(filteredTeachers.map(t => t.id));
    setSelectedTeacherIds(prev => prev.filter(id => !filteredSet.has(id)));
  };

  // Confirm Assign Teachers
  const handleConfirmAssign = async () => {
    if (!courseToAssign) return;
    try {
      setIsSavingAssign(true);
      const res = await api.post(`/institute-admin/courses/${courseToAssign.id}/assign-teacher`, {
        teacher_ids: selectedTeacherIds
      });

      const updatedTeachers = res.data.teachers || [];
      setCourses(prev => prev.map(c => {
        if (c.id === courseToAssign.id) {
          return { ...c, teachers: updatedTeachers };
        }
        return c;
      }));

      // Refresh teachers list to update course counts
      fetchTeachers();

      if (selectedTeacherIds.length === 0) {
        success(`All faculty unassigned from course "${courseToAssign.title}".`);
      } else if (selectedTeacherIds.length === 1) {
        const assignedTeacher = teachers.find(t => t.id === selectedTeacherIds[0]);
        const teacherName = assignedTeacher ? (assignedTeacher.name || assignedTeacher.username) : 'Teacher';
        success(`Course "${courseToAssign.title}" successfully assigned to ${teacherName}! The course is now active on their teacher dashboard.`);
      } else {
        success(`Course "${courseToAssign.title}" successfully assigned to ${selectedTeacherIds.length} faculty members! The course is now active on all their teacher dashboards.`);
      }
      setIsAssignModalOpen(false);
      setCourseToAssign(null);
    } catch (err: any) {
      console.error(err);
      error(err.response?.data?.detail || 'Failed to assign teachers to course');
    } finally {
      setIsSavingAssign(false);
    }
  };

  // Unassign all teachers from this course
  const handleUnassignAllTeachers = async () => {
    if (!courseToAssign) return;
    try {
      setIsSavingAssign(true);
      await api.post(`/institute-admin/courses/${courseToAssign.id}/unassign-teacher`, {});

      setCourses(prev => prev.map(c => {
        if (c.id === courseToAssign.id) {
          return { ...c, teachers: [] };
        }
        return c;
      }));

      fetchTeachers();
      success(`All faculty unassigned from course "${courseToAssign.title}".`);
      setIsAssignModalOpen(false);
      setCourseToAssign(null);
    } catch (err: any) {
      console.error(err);
      error(err.response?.data?.detail || 'Failed to unassign teachers');
    } finally {
      setIsSavingAssign(false);
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
  } = usePagination({ data: filteredCourses, itemsPerPage: 10 });

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Course List" description="Manage and organize your courses." breadcrumbs={<Breadcrumb items={[{ label: 'Courses' }]} />} />
        <LoadingState message="Loading course catalog..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Course List" description="Manage and organize your courses." breadcrumbs={<Breadcrumb items={[{ label: 'Courses' }]} />} />
        <ErrorState
          title="Courses Load Failure"
          message={errorMessage}
          onRetry={fetchCourses}
          retryLabel="Retry"
        />
        <div className="flex justify-center mt-4">
          <Button variant="secondary" size="sm" onClick={() => navigate('/institute-admin/login')}>
            Sign In with Institute Admin Account
          </Button>
        </div>
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
                placeholder="Search by title, code, description..."
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
                <option value="Online">Online</option>
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
              <TableHeaderCell>Assigned Teachers</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map(course => {
              const courseTeachers = course.teachers || [];
              const hasTeachers = courseTeachers.length > 0;

              return (
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
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate font-mono mt-0.5">
                          <span>{course.code}</span>
                          {course.duration && <span>• {course.duration}</span>}
                          {course.price !== undefined && (
                            <span className="text-amber-400 font-semibold">• {course.price === 0 ? 'Free' : `$${course.price}`}</span>
                          )}
                        </div>
                        {course.start_date && (
                          <span className="text-[11px] text-sky-400 mt-0.5">
                            Starts: {new Date(course.start_date).toLocaleDateString()}
                          </span>
                        )}
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
                  {/* Near Status: Assign Option */}
                  <TableCell>
                    {hasTeachers ? (
                      <div className="flex items-center gap-2">
                        <div 
                          onClick={() => handleOpenAssignModal(course)}
                          className="group cursor-pointer flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 transition-all max-w-[250px]"
                          title={courseTeachers.map(t => t.name || t.username).join(', ')}
                        >
                          {courseTeachers.length === 1 ? (
                            <>
                              <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {(courseTeachers[0].name || courseTeachers[0].username).charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col truncate">
                                <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                                  {courseTeachers[0].name || courseTeachers[0].username}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate font-mono">
                                  {courseTeachers[0].email}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex -space-x-2 shrink-0">
                                {courseTeachers.slice(0, 3).map((t, idx) => (
                                  <div
                                    key={t.id}
                                    className="w-6 h-6 rounded-full bg-violet-600/40 border border-violet-400/50 text-violet-200 flex items-center justify-center text-[9px] font-bold ring-1 ring-slate-950"
                                    title={t.name || t.username}
                                    style={{ zIndex: 3 - idx }}
                                  >
                                    {(t.name || t.username).charAt(0).toUpperCase()}
                                  </div>
                                ))}
                                {courseTeachers.length > 3 && (
                                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-[9px] font-bold ring-1 ring-slate-950">
                                    +{courseTeachers.length - 3}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                                    {courseTeachers[0].name || courseTeachers[0].username}
                                  </span>
                                  <span className="text-[9px] font-bold text-violet-400 bg-violet-950/70 border border-violet-800/60 px-1 py-0.2 rounded-full shrink-0">
                                    +{courseTeachers.length - 1}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 truncate font-mono">
                                  {courseTeachers.length} teachers assigned
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => handleOpenAssignModal(course)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Manage Faculty Assignment"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenAssignModal(course)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition-all duration-150 hover:shadow-xs hover:border-emerald-500/70 active:scale-98 cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Assign</span>
                      </button>
                    )}
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
                        onClick={() => handleDeleteClick(course)}
                        title="Delete Course"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
      )}

      {/* Assign Teacher Scrollbox Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          if (!isSavingAssign) {
            setIsAssignModalOpen(false);
            setCourseToAssign(null);
          }
        }}
        title="Assign Course to Teachers"
        size="md"
      >
        <ModalBody className="space-y-4">
          {courseToAssign && (
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Target Course</span>
                <h4 className="text-sm font-semibold text-slate-100">{courseToAssign.title}</h4>
                <p className="text-xs text-slate-500 font-mono">{courseToAssign.code} • {courseToAssign.course_type}</p>
              </div>
              <Badge variant={courseToAssign.status === 'Published' || courseToAssign.status === 'Active' ? 'success' : 'warning'}>
                {courseToAssign.status}
              </Badge>
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            Select one or more teachers from the list below to assign this course. Once assigned, this course and its classrooms will appear directly on all assigned teachers' dashboards.
          </p>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <Input
              placeholder="Search faculty by name or email..."
              value={teacherSearch}
              onChange={e => setTeacherSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Teacher Selection Scrollbox */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Faculty Members
                </label>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded-full">
                  {selectedTeacherIds.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                {filteredTeachers.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-medium cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600 text-xs">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllFiltered}
                      className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </>
                )}
                <span className="text-[11px] text-slate-500 ml-1">
                  ({filteredTeachers.length} available)
                </span>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto pr-1 space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/50 p-2.5">
              {loadingTeachers ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <span className="text-xs">Loading faculty list...</span>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  {teacherSearch ? `No teachers matching "${teacherSearch}" found.` : "No teachers registered in your institute yet."}
                </div>
              ) : (
                filteredTeachers.map((t) => {
                  const isSelected = selectedTeacherIds.includes(t.id);
                  const isCurrentlyAssigned = courseToAssign?.teachers?.some(ct => ct.id === t.id);

                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTeacherSelection(t.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-all duration-150 flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/30'
                          : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-500/40'
                            : 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                        }`}>
                          {(t.name || t.username).substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {t.name || t.username}
                            </span>
                            {isCurrentlyAssigned && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0">
                                <Check className="w-2.5 h-2.5" />
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono truncate">
                            {t.email}
                          </span>
                          {t.assigned_courses_count !== undefined && (
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              {t.assigned_courses_count} {t.assigned_courses_count === 1 ? 'course' : 'courses'} currently assigned
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                            : 'border-slate-700 bg-slate-800/80'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="flex items-center justify-between sm:justify-between w-full">
          <div>
            {courseToAssign?.teachers && courseToAssign.teachers.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleUnassignAllTeachers}
                disabled={isSavingAssign}
              >
                Unassign All
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAssignModalOpen(false);
                setCourseToAssign(null);
              }}
              disabled={isSavingAssign}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={isSavingAssign ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              onClick={handleConfirmAssign}
              disabled={isSavingAssign}
            >
              {isSavingAssign 
                ? 'Assigning...' 
                : selectedTeacherIds.length === 0
                  ? 'Clear Assignments'
                  : selectedTeacherIds.length === 1
                    ? 'Assign to Dashboard'
                    : `Assign (${selectedTeacherIds.length}) to Dashboard`}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Confirm Course Deletion"
        message={`Are you absolutely sure you want to delete course "${selectedCourse?.title}"? All mapped modules, books, and class materials may become orphaned. This action is irreversible.`}
        confirmLabel="Yes, Delete Course"
        cancelLabel="No, Keep It"
        onConfirm={handleConfirmDelete}
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
