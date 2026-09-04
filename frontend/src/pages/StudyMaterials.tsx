import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Upload, Download, Trash2, Edit2, FileText, Video, Mic } from 'lucide-react';
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

interface StudyMaterial {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_title: string;
  material_type: string;
  visibility: string;
  status: string;
  file_url: string;
  created_at: string;
}

export const StudyMaterialsList: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const { success, error: showError } = useToast();

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [materialType, setMaterialType] = useState('Notes');
  const [visibility, setVisibility] = useState('public');
  const [status, setStatus] = useState('published');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const [matRes, curRes] = await Promise.all([
              api.get('/institute-admin/study-materials'),
              api.get('/institute-admin/courses')
          ]);
          setMaterials(matRes.data);
          setCourses(curRes.data);
          if (matRes.data.length === 0) setUiState('empty');
          else setUiState('normal');
      } catch (err) {
          console.error(err);
          showError('Failed to load study materials');
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // Filter lists
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || m.material_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDeleteConfirm = async () => {
    if (selectedMaterial) {
      try {
          await api.delete(`/institute-admin/study-materials/${selectedMaterial.id}`);
          success('Material deleted successfully');
          fetchData();
      } catch (err) {
          showError('Failed to delete material');
      }
      setIsDeleteOpen(false);
      setSelectedMaterial(null);
    }
  };

  const openCreateForm = () => {
    setIsEdit(false);
    setSelectedMaterial(null);
    setTitle('');
    setDescription('');
    setCourseId('');
    setMaterialType('Notes');
    setVisibility('public');
    setStatus('published');
    setFile(null);
    setIsFormOpen(true);
  };

  const openEditForm = (material: StudyMaterial) => {
    setIsEdit(true);
    setSelectedMaterial(material);
    setTitle(material.title);
    setDescription(material.description || '');
    setCourseId(material.course_id.toString());
    setMaterialType(material.material_type);
    setVisibility(material.visibility);
    setStatus(material.status);
    setFile(null); // Require re-upload if they want to change file
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courseId) {
        showError("Title and Course are required.");
        return;
    }
    if (!isEdit && !file) {
        showError("Resource file upload is required.");
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('course_id', courseId);
    formData.append('description', description);
    formData.append('material_type', materialType);
    formData.append('visibility', visibility);
    formData.append('status', status);
    if (file) {
        formData.append('file', file);
    }

    try {
        if (isEdit && selectedMaterial) {
            await api.put(`/institute-admin/study-materials/${selectedMaterial.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            await api.post('/institute-admin/study-materials', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        setIsFormOpen(false);
        success(`Material ${isEdit ? 'updated' : 'uploaded'} successfully`);
        fetchData();
    } catch (e) {
        showError("Failed to save material.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'Video': return <Video className="h-4.5 w-4.5" />;
          case 'Audio': return <Mic className="h-4.5 w-4.5" />;
          default: return <FileText className="h-4.5 w-4.5" />;
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
  } = usePagination({ data: filteredMaterials, itemsPerPage: 10 });

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Study Materials" description="Manage files, slides, and recordings." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Materials' }]} />} />
        <LoadingState message="Loading study materials..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Study Materials" description="Manage files, slides, and recordings." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Materials' }]} />} />
        <ErrorState title="Failed to load materials" message="Could not fetch files from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Study Materials & Resources"
          description="Upload and organize lecture slides, handouts, and standalone video files."
          breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Study Materials' }]} />}
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={openCreateForm}
            >
              Upload Material
            </Button>
          }
        />
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Resources</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 w-full md:w-auto md:min-w-[200px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</label>
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Notes">Notes / Slides</option>
              <option value="Video">Video Recording</option>
              <option value="Audio">Audio Lecture</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List items */}
      {filteredMaterials.length === 0 ? (
        <EmptyState
          title="No Resources Found"
          description="You have not uploaded any study materials or recordings."
          actionLabel="Upload Material"
          onActionClick={openCreateForm}
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Resource</TableHeaderCell>
                <TableHeaderCell>Mapped Course</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Size / Ext</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map(m => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400">
                        {getIcon(m.material_type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{m.title}</span>
                        <span className="text-xs text-slate-500">{m.description || 'No description provided'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {courses.find(c => c.id === m.course_id)?.title || 'General Resource'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.material_type === 'Video' ? 'warning' : 'info'}>
                      {m.material_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">
                    {m.visibility || 'Public'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a href={`http://localhost:8000${m.file_url}`} target="_blank" rel="noreferrer">
                          <Button variant="secondary" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
                            Download
                          </Button>
                      </a>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditForm(m)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedMaterial(m);
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
        message={`Are you sure you want to delete "${selectedMaterial?.title}"? This cannot be undone.`}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEdit ? "Edit Study Material" : "Upload New Material"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Material Title <span className="text-red-500">*</span></label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 Slide Deck"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Type <span className="text-red-500">*</span></label>
                <Select value={materialType} onChange={e => setMaterialType(e.target.value)}>
                    <option value="Notes">Notes / Slides</option>
                    <option value="Video">Video Recording</option>
                    <option value="Audio">Audio Lecture</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Target Course <span className="text-red-500">*</span></label>
                <Select value={courseId} onChange={e => setCourseId(e.target.value)}>
                    <option value="">-- Select Course --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </Select>
              </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief summary..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Status</label>
                 <Select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                 </Select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Visibility</label>
                 <Select value={visibility} onChange={e => setVisibility(e.target.value)}>
                    <option value="public">Public (All students)</option>
                    <option value="private">Private (Admin only)</option>
                 </Select>
              </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Upload File {isEdit ? "(Optional, overrides existing)" : "<span className='text-red-500'>*</span>"}</label>
            <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-800 border-dashed rounded-lg cursor-pointer bg-slate-950 hover:bg-slate-900">
                    <div className="flex flex-col items-center justify-center pt-3 pb-4">
                        <Upload className="w-6 h-6 mb-2 text-slate-500" />
                        <p className="text-xs text-slate-500">{file ? file.name : "Click to select a file"}</p>
                    </div>
                    <input type="file" className="hidden" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setFile(e.target.files[0]);
                        }
                    }} />
                </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Material'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudyMaterialsList;
