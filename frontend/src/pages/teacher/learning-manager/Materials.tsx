import React, { useEffect, useState } from 'react';
import { FileDown, FileSpreadsheet, FileVideo, Plus, Download, Trash2, X, RefreshCw, Upload, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../context/ToastContext';
import { teacherApi } from '../../../api/teacher';

export const Materials: React.FC = () => {
  const toast = useToast();
  const [materials, setMaterials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [materialType, setMaterialType] = useState('Slides');
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matRes, coursesRes] = await Promise.all([
        teacherApi.getMaterials(),
        teacherApi.getCourses()
      ]);
      setMaterials(matRes);
      setCourses(coursesRes);
      if (coursesRes.length > 0) {
        setSelectedCourseId(String(coursesRes[0].id));
      }
    } catch (err) {
      toast.error('Failed to load study materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update batches when selected course changes
  useEffect(() => {
    if (selectedCourseId) {
      const fetchCourseDetails = async () => {
        try {
          const detail = await teacherApi.getCourse(Number(selectedCourseId));
          setBatches(detail.batches || []);
          if (detail.batches && detail.batches.length > 0) {
            setSelectedBatchId(String(detail.batches[0].id));
          } else {
            setSelectedBatchId('');
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchCourseDetails();
    }
  }, [selectedCourseId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await teacherApi.uploadFile(file);
      setFileUrl(res.file_url);
      toast.success('Study material file uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload study material.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl || !selectedCourseId) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      await teacherApi.createMaterial({
        title,
        description,
        file_url: fileUrl,
        course_id: Number(selectedCourseId),
        batch_id: selectedBatchId ? Number(selectedBatchId) : null,
        material_type: materialType,
        visibility: 'public',
        status: 'published'
      });
      toast.success('Study material published successfully!');
      setTitle('');
      setDescription('');
      setFileUrl('');
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error('Failed to publish study material.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return;
    try {
      await teacherApi.deleteMaterial(id);
      toast.success('Study material deleted.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete study material.');
    }
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return FileVideo;
      case 'slides':
        return FileDown;
      case 'syllabus':
        return FileSpreadsheet;
      default:
        return FileText;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading learning assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Study Materials
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Publish lectures slides, cheating sheets, code snippets, or tutorial videos.
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="bg-violet-650 hover:bg-violet-550 cursor-pointer flex items-center gap-1.5"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showAddForm ? 'Cancel' : 'Add Material'}</span>
        </Button>
      </div>

      {showAddForm && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Publish Study Material</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Course</label>
                  <Select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    options={courses.map(c => ({ value: String(c.id), label: c.title }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Batch (Optional)</label>
                  <Select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    options={[
                      { value: '', label: 'All Batches' },
                      ...batches.map(b => ({ value: String(b.id), label: b.name }))
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hooks Tutorial Handout" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Material Type</label>
                  <Select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    options={[
                      { value: 'Slides', label: 'Lecture Slides' },
                      { value: 'Notes', label: 'Reference Notes' },
                      { value: 'Video', label: 'Video Tutorial' },
                      { value: 'Syllabus', label: 'Syllabus/Outline' },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief detail about this handout" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Upload File</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-880 bg-slate-900 hover:bg-slate-850 cursor-pointer text-xs font-semibold text-slate-350">
                    <Upload className="h-4 w-4 text-violet-400" />
                    <span>Upload Attachment</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {uploading && <RefreshCw className="h-4 w-4 animate-spin text-violet-500" />}
                  {fileUrl && <span className="text-xs text-emerald-400 font-medium truncate max-w-xs">{fileUrl}</span>}
                </div>
              </div>

              <Button type="submit" className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer mt-2">
                Publish Handout
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No study materials published</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Publish notes, slide decks, handouts, and video references for your batches.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((mat) => {
            const Icon = getIconForType(mat.material_type);
            return (
              <Card key={mat.id}>
                <CardContent className="p-5 flex gap-4 items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-950/40 border border-violet-500/20 text-violet-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-violet-400 bg-violet-950/40 border border-violet-900/40 px-1.5 py-0.2 rounded uppercase">
                      {mat.course_title}
                    </span>
                    <h3 className="text-sm font-bold text-slate-200 truncate mt-1">{mat.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{mat.material_type} • {mat.batch_name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {mat.file_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`http://localhost:8000${mat.file_url}`, '_blank')}
                        className="text-slate-400 hover:text-slate-250 cursor-pointer p-1.5"
                        aria-label="Download material"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mat.id)}
                      className="text-rose-450 hover:text-rose-350 cursor-pointer p-1.5"
                      aria-label="Delete material"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default Materials;
