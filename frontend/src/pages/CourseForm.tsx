import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../api/client';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  ConfirmationDialog,
  LoadingState
} from '../components/ui';
import { useToast } from '../context/ToastContext';

interface CourseFormProps {
  mode: 'create' | 'edit';
}

export const CourseForm: React.FC<CourseFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();

  // Form Fields State
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [type, setType] = useState('Online');
  const [visibility, setVisibility] = useState('Public');
  const [status, setStatus] = useState('Draft');

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardOpen, setShowDiscardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const { success, error: showError } = useToast();

  // Prepopulate form on Edit mode
  useEffect(() => {
    if (mode === 'edit' && courseId) {
      api.get(`/institute-admin/courses/${courseId}`)
        .then(res => {
          const data = res.data;
          setTitle(data.title);
          setCode(data.code);
          setDescription(data.description || '');
          setType(data.course_type);
          setVisibility(data.visibility);
          setStatus(data.status);
          if (data.thumbnail_url) {
            setThumbnailPreview(`http://localhost:8000${data.thumbnail_url}`);
          }
        })
        .catch(err => {
          console.error(err);
          showError('Failed to load course details');
          navigate('/institute-admin/courses');
        })
        .finally(() => setIsLoading(false));
    }
  }, [mode, courseId, navigate]);

  // Track changes to trigger dirty state warning
  const handleInputChange = (fieldSetter: any) => (e: any) => {
    fieldSetter(e.target.value);
    setIsDirty(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setIsDirty(true);
    }
  };

  const validate = (): boolean => {
    const tempErrors: Record<string, string> = {};
    if (!title.trim()) tempErrors.title = 'Course Title is required.';
    else if (title.trim().length < 5) tempErrors.title = 'Title must be at least 5 characters.';

    if (!code.trim()) tempErrors.code = 'Course Code is required.';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSaving(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('code', code);
    formData.append('description', description);
    formData.append('course_type', type);
    formData.append('visibility', visibility);
    formData.append('status', status);
    if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
    }

    try {
      if (mode === 'edit' && courseId) {
        await api.put(`/institute-admin/courses/${courseId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/institute-admin/courses`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
        setIsDirty(false);
        success(`Course ${mode === 'create' ? 'created' : 'updated'} successfully`);
        navigate('/institute-admin/courses');
      } catch (err: any) {
        console.error(err);
        showError(err.response?.data?.detail || `Failed to ${mode} course`);
      } finally {
        setIsSaving(false);
      }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowDiscardOpen(true);
    } else {
      navigate('/institute-admin/courses');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading course editor..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Create New Course' : 'Edit Course'}
        description={mode === 'create' ? 'Define a new academic course structure.' : `Modify configuration parameters for course: ${title}`}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Courses' },
              { label: mode === 'create' ? 'Create' : 'Edit' }
            ]}
          />
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={handleBack}
          >
            Back to List
          </Button>
        }
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Information</span>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Course Title <span className="text-red-500">*</span></label>
                <Input
                  value={title}
                  onChange={handleInputChange(setTitle)}
                  placeholder="e.g. Master Course in React Native Development"
                  error={errors.title}
                />
                {errors.title && <span className="text-xs font-semibold text-red-500">{errors.title}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Course Code <span className="text-red-500">*</span></label>
                <Input
                  value={code}
                  onChange={handleInputChange(setCode)}
                  placeholder="e.g. WEB101"
                  error={errors.code}
                />
                {errors.code && <span className="text-xs font-semibold text-red-500">{errors.code}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Course Description</label>
                <textarea
                  value={description}
                  onChange={handleInputChange(setDescription)}
                  placeholder="Describe what students will learn, projects they will build, and prerequisites..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                {errors.description && <span className="text-xs font-semibold text-red-500">{errors.description}</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thumbnail & Sidebar Settings */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course Thumbnail</span>
              
              {/* Image Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group shadow-inner">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-slate-700" />
                )}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Upload Image
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scope Settings</span>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Course Type</label>
                <Select value={type} onChange={handleInputChange(setType)}>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid Delivery (Prerecorded + Live)</option>
                  <option value="Live">Live Class Stream Only</option>
                  <option value="Prerecorded">Prerecorded Lectures Only</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Course Visibility</label>
                <div className="space-y-2 pt-1.5">
                  {(['Public', 'Private', 'Unlisted'] as const).map(vis => (
                    <label key={vis} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value={vis}
                        checked={visibility === vis}
                        onChange={() => { setVisibility(vis); setIsDirty(true); }}
                        className="rounded-full border-slate-800 text-emerald-500 bg-slate-950 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>
                        <strong className="text-slate-200">{vis}</strong>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300">Status</label>
                <Select value={status} onChange={handleInputChange(setStatus)}>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>

              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                  leftIcon={<Save className="h-4 w-4" />}
                  type="submit"
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleBack}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Discard confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDiscardOpen}
        title="Discard Unsaved Changes"
        message="You have unsaved form fields in this editor. Moving away from this page will lose all modifications."
        confirmLabel="Discard & Go Back"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          setIsDirty(false);
          setShowDiscardOpen(false);
          navigate('/institute-admin/courses');
        }}
        onClose={() => setShowDiscardOpen(false)}
        variant="warning"
      />
    </div>
  );
};

export default CourseForm;
