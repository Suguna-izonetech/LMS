import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, List } from 'lucide-react';
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
}

interface Lecture {
    id: number;
    module_id: number;
    title: string;
    description: string;
    video_url: string;
    ordering: number;
    status: string;
}

interface PrerecordedModule {
    id: number;
    title: string;
    description: string;
    course_id: number;
    course_title?: string;
    status: string;
    lectures: Lecture[];
}

export const PrerecordedModulesList: React.FC = () => {
  const navigate = useNavigate();

  const [modules, setModules] = useState<PrerecordedModule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const { success, error } = useToast();

  // Delete modal state
  const [selectedModule, setSelectedModule] = useState<PrerecordedModule | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [modRes, curRes] = await Promise.all([
              api.get('/institute-admin/modules'),
              api.get('/institute-admin/courses')
          ]);
          setModules(modRes.data);
          setCourses(curRes.data);
          if (modRes.data.length === 0) setUiState('empty');
          else setUiState('normal');
      } catch (err) {
          console.error(err);
          error('Failed to load pre-recorded modules');
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // Filter lists
  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === 'All' || m.course_id.toString() === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const handleDeleteConfirm = async () => {
    if (selectedModule) {
      try {
          await api.delete(`/institute-admin/modules/${selectedModule.id}`);
          fetchData();
          setIsDeleteOpen(false);
          setSelectedModule(null);
          success('Module deleted successfully');
      } catch (err) {
          console.error(err);
          error('Failed to delete module');
      }
    }
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Prerecorded Modules" description="Structure and organize learning chapters." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Prerecorded' }]} />} />
        <LoadingState message="Connecting lecture sequence indexes..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Prerecorded Modules" description="Structure and organize learning chapters." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Prerecorded' }]} />} />
        <ErrorState
          title="Module Indexes Out of Sync"
          message="Could not map lecture file sizes with course modules. Please refresh indexing cache."
          onRetry={fetchData}
          retryLabel="Reindex"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Prerecorded Lectures Console"
          description="Organize video files and study lectures into chapters mapped to academic courses."
          breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Prerecorded Modules' }]} />}
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/institute-admin/learning-manager/prerecorded-modules/create')}
            >
              Create Module
            </Button>
          }
        />
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Chapters / Modules</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search module by title name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 w-full md:w-auto md:min-w-[280px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course Filter</label>
            <Select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
              <option value="All">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
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
        } = usePagination({ data: filteredModules, itemsPerPage: 10 });

        if (filteredModules.length === 0) {
          return (
            <EmptyState
                title="No Modules Found"
                description={searchQuery || courseFilter !== 'All' ? "No modules matched your search." : "No pre-recorded modules created yet."}
                actionLabel={searchQuery || courseFilter !== 'All' ? "Reset Filters" : "Create Module"}
                onActionClick={searchQuery || courseFilter !== 'All' ? () => { setSearchQuery(''); setCourseFilter('All'); } : () => navigate('/institute-admin/learning-manager/prerecorded-modules/create')}
            />
          );
        }

        return (
          <TableContainer>
              <Table>
                  <TableHeader>
              <TableRow>
                <TableHeaderCell>Chapter / Module Name</TableHeaderCell>
                <TableHeaderCell>Course Mapped</TableHeaderCell>
                <TableHeaderCell>Total Lectures</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {paginatedData.map(mod => (
                      <TableRow key={mod.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-indigo-400">
                          <List className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{mod.title}</span>
                          <span className="text-xs text-slate-500 max-w-[340px] truncate">{mod.description}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-355 font-medium">
                      {mod.course_title || 'Unmapped'}
                    </TableCell>
                    <TableCell className="text-slate-400 font-bold">
                      {mod.lectures.length} Lectures
                    </TableCell>
                    <TableCell>
                      <Badge variant={mod.status === 'Published' ? 'success' : 'warning'}>
                        {mod.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                          onClick={() => navigate(`/institute-admin/learning-manager/prerecorded-modules/${mod.id}`)}
                        >
                          Edit Lectures
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedModule(mod);
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
        );
      })()}

      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Confirm Module Deletion"
        message={`Are you sure you want to delete chapter "${selectedModule?.title}"? All attached video reference records will be permanently removed.`}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedModule(null);
        }}
        variant="danger"
      />
    </div>
  );
};

export default PrerecordedModulesList;
