import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, FileVideo } from 'lucide-react';
import api from '../api/client';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Modal,
  ConfirmationDialog
} from '../components/ui';
import { useToast } from '../context/ToastContext';

interface Course {
  id: number;
  title: string;
}

interface Lecture {
    id: number;
    title: string;
    description?: string;
    video_url: string;
    ordering: number;
    status: string;
}

interface PrerecordedModule {
    id: number;
    title: string;
    description: string;
    course_id: number;
    status: string;
    lectures: Lecture[];
}

export const ModuleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'create';

  const [courses, setCourses] = useState<Course[]>([]);
  const [existingModule, setExistingModule] = useState<PrerecordedModule | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Published');
  const [lectures, setLectures] = useState<Lecture[]>([]);

  // Modal for lecture adding
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureVideoUrl, setLectureVideoUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // States
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDiscardOpen, setShowDiscardOpen] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    const loadData = async () => {
        try {
            const courseRes = await api.get('/institute-admin/courses');
            setCourses(courseRes.data);

            if (isEdit) {
                const modRes = await api.get('/institute-admin/modules');
                const match = modRes.data.find((m: any) => m.id.toString() === id);
                if (match) {
                    setExistingModule(match);
                    setTitle(match.title);
                    setDescription(match.description || '');
                    setCourseId(match.course_id.toString());
                    setStatus(match.status);
                    setLectures(match.lectures || []);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };
    loadData();
  }, [id, isEdit]);

  const handleInputChange = (setter: any) => (e: any) => {
    setter(e.target.value);
    setIsDirty(true);
  };

  // Reorder lectures by swapping array indexes
  const moveLecture = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lectures.length) return;

    const listCopy = [...lectures];
    const temp = listCopy[index];
    listCopy[index] = listCopy[newIndex];
    listCopy[newIndex] = temp;
    
    // Update ordering logic locally
    listCopy.forEach((lec, idx) => lec.ordering = idx + 1);
    setLectures(listCopy);
    setIsDirty(true);
    
    // If it's an existing lecture, save immediately to backend to avoid drift
    if (isEdit && listCopy[index].id && listCopy[newIndex].id) {
        try {
            await api.put(`/institute-admin/modules/lectures/${listCopy[index].id}`, { ordering: listCopy[index].ordering });
            await api.put(`/institute-admin/modules/lectures/${listCopy[newIndex].id}`, { ordering: listCopy[newIndex].ordering });
        } catch (e) {
            console.error(e);
        }
    }
  };

  // Delete lecture
  const deleteLecture = async (index: number) => {
    const lec = lectures[index];
    if (isEdit && lec.id) {
        if(confirm("Are you sure you want to delete this lecture?")) {
            try {
                await api.delete(`/institute-admin/modules/lectures/${lec.id}`);
            } catch (e) {
                error("Failed to delete lecture");
                return;
            }
        } else {
            return;
        }
    }
    setLectures(prev => prev.filter((_, idx) => idx !== index));
    setIsDirty(true);
  };

  // Simulate video upload
  const simulateUpload = () => {
    if (!lectureTitle.trim()) {
      error('Please fill out the Lecture Title first.');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setLectureVideoUrl(`https://player.vimeo.com/video/mock_${Math.floor(Math.random()*10000)}`);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
      }
    }, 200);
  };

  const handleSaveLecture = async () => {
    if (!lectureTitle.trim()) return;

    if (isEdit) {
        // Save to backend immediately
        try {
            const res = await api.post(`/institute-admin/modules/${id}/lectures`, {
                title: lectureTitle,
                description: "",
                video_url: lectureVideoUrl || 'https://youtube.com',
                ordering: lectures.length + 1,
                status: 'Published'
            });
            setLectures(prev => [...prev, res.data]);
            success('Lecture saved successfully');
        } catch (e) {
            error('Failed to save lecture');
            return;
        }
    } else {
        // Just store locally for draft module
        const newLecture: Lecture = {
          id: 0,
          title: lectureTitle,
          video_url: lectureVideoUrl || 'https://youtube.com',
          ordering: lectures.length + 1,
          status: 'Published'
        };
        setLectures(prev => [...prev, newLecture]);
    }
    
    // Reset Form
    setLectureTitle('');
    setLectureVideoUrl('');
    setUploadProgress(null);
    setIsAddLectureOpen(false);
    setIsDirty(true);
  };

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!title.trim()) tempErrors.title = 'Module Name is required.';
    if (!courseId) tempErrors.courseId = 'Please map this module to a Course.';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
        if (isEdit) {
            await api.put(`/institute-admin/modules/${id}`, {
                title,
                description,
                course_id: Number(courseId),
                status
            });
        } else {
            const res = await api.post('/institute-admin/modules', {
                title,
                description,
                course_id: Number(courseId),
                status
            });
            
            // Post any locally created lectures
            if (lectures.length > 0) {
                for (const lec of lectures) {
                    await api.post(`/institute-admin/modules/${res.data.id}/lectures`, {
                        title: lec.title,
                        description: lec.description || "",
                        video_url: lec.video_url,
                        ordering: lec.ordering,
                        status: lec.status
                    });
                }
            }
        }

        setIsDirty(false);
        success(`Module ${isEdit ? 'updated' : 'created'} successfully`);
        navigate('/institute-admin/learning-manager/prerecorded-modules');
    } catch (e) {
        error('Failed to save module');
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowDiscardOpen(true);
    } else {
      navigate('/institute-admin/learning-manager/prerecorded-modules');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Chapter Module' : 'Create Prerecorded Module'}
        description={isEdit ? `Add or reorder video lectures for: ${existingModule?.title}` : 'Create a structured playlist container of video files.'}
        breadcrumbs={
          <Breadcrumb
            items={[
              { label: 'Learning Manager' },
              { label: 'Prerecorded Modules' },
              { label: isEdit ? 'Edit' : 'Create' }
            ]}
          />
        }
        actions={
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={handleBack}>
            Back to List
          </Button>
        }
      />

      <form onSubmit={handleSaveModule} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main metadata */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Module Details</span>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350">Chapter / Module Name <span className="text-red-500">*</span></label>
                <Input
                  value={title}
                  onChange={handleInputChange(setTitle)}
                  placeholder="e.g. Chapter 1: Advanced Cascading Style Sheets (CSS)"
                  error={errors.title}
                />
                {errors.title && <span className="text-xs font-semibold text-red-500">{errors.title}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350">Brief Description</label>
                <textarea
                  value={description}
                  onChange={handleInputChange(setDescription)}
                  placeholder="Provide context on topics covered, assignment details, and learning milestones..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lecture Playlist Manager */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lectures Playlists ({lectures.length})</span>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  type="button"
                  onClick={() => setIsAddLectureOpen(true)}
                >
                  Add Video Lecture
                </Button>
              </div>

              {lectures.length === 0 ? (
                <div className="border border-dashed border-slate-850 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-600">
                    <FileVideo className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">No video files added</span>
                  <p className="text-[11px] text-slate-500 max-w-[280px]">Add and arrange lecture videos in order to help students learn step by step.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lectures.sort((a,b) => a.ordering - b.ordering).map((lec, idx) => (
                    <div key={lec.id || Math.random()} className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950/20 border border-indigo-900/60 flex items-center justify-center text-indigo-400">
                          <span className="text-xs font-bold font-mono">{idx + 1}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-200">{lec.title}</span>
                          <a href={lec.video_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline font-bold">Video URL</a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveLecture(idx, 'up')}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          disabled={idx === lectures.length - 1}
                          onClick={() => moveLecture(idx, 'down')}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          type="button"
                          onClick={() => deleteLecture(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Course Maps & Publish Panel */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mapping Settings</span>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-355">Map to Academic Course <span className="text-red-500">*</span></label>
                <Select value={courseId} onChange={handleInputChange(setCourseId)}>
                  <option value="">-- Choose Target Course --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </Select>
                {errors.courseId && <span className="text-xs font-semibold text-red-500">{errors.courseId}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350">Publishing Status</label>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Published"
                      checked={status === 'Published'}
                      onChange={() => { setStatus('Published'); setIsDirty(true); }}
                      className="rounded-full text-indigo-500 bg-slate-950 border-slate-800 focus:ring-0"
                    />
                    <span><strong>Published</strong> - Accessible by mapped students.</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Draft"
                      checked={status === 'Draft'}
                      onChange={() => { setStatus('Draft'); setIsDirty(true); }}
                      className="rounded-full text-indigo-500 bg-slate-950 border-slate-800 focus:ring-0"
                    />
                    <span><strong>Draft</strong> - Invisible to students; editing in progress.</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <Button variant="primary" className="flex-1" leftIcon={<Save className="h-4 w-4" />} type="submit">
                  Save Module
                </Button>
                <Button variant="outline" type="button" onClick={handleBack}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Add lecture Modal */}
      <Modal
        isOpen={isAddLectureOpen}
        onClose={() => setIsAddLectureOpen(false)}
        title="Add Prerecorded Video Lecture"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Lecture Title</label>
            <Input
              value={lectureTitle}
              onChange={e => setLectureTitle(e.target.value)}
              placeholder="e.g. 1.2 Introduction to Grid Layouts"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Video Link URL</label>
              <Input
                value={lectureVideoUrl}
                onChange={e => setLectureVideoUrl(e.target.value)}
                placeholder="e.g. https://vimeo.com/..."
              />
            </div>
            
            <div className="flex flex-col justify-end">
              <Button type="button" variant="secondary" onClick={simulateUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Video File'}
              </Button>
            </div>
          </div>

          {/* Upload Progress feedback */}
          {uploadProgress !== null && (
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>{lectureVideoUrl}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsAddLectureOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveLecture} disabled={isUploading || !lectureTitle}>
              Add to Playlist
            </Button>
          </div>
        </div>
      </Modal>

      {/* Discard prompt */}
      <ConfirmationDialog
        isOpen={showDiscardOpen}
        title="Discard Unsaved Draft"
        message="You have unsaved metadata modifications. Are you sure you want to discard them?"
        confirmLabel="Discard & Go Back"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          setIsDirty(false);
          setShowDiscardOpen(false);
          navigate('/institute-admin/learning-manager/prerecorded-modules');
        }}
        onClose={() => setShowDiscardOpen(false)}
        variant="warning"
      />
    </div>
  );
};

export default ModuleForm;
