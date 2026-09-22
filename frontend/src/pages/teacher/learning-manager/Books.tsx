import React, { useEffect, useState } from 'react';
import { Book as BookIcon, Plus, Download, FileText, Trash2, X, RefreshCw, Upload } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../context/ToastContext';
import { teacherApi } from '../../../api/teacher';

export const Books: React.FC = () => {
  const toast = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksRes, coursesRes] = await Promise.all([
        teacherApi.getBooks(),
        teacherApi.getCourses()
      ]);
      setBooks(booksRes);
      setCourses(coursesRes);
    } catch (err) {
      toast.error('Failed to load textbooks catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await teacherApi.uploadFile(file);
      setFileUrl(res.file_url);
      toast.success('Book file uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload book file.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !fileUrl || selectedCourseIds.length === 0) {
      toast.error('Please fill in all fields and assign at least one course.');
      return;
    }

    try {
      await teacherApi.createBook({
        title,
        author,
        description,
        file_url: fileUrl,
        course_ids: selectedCourseIds
      });
      toast.success('Book published to courses successfully!');
      setTitle('');
      setAuthor('');
      setDescription('');
      setFileUrl('');
      setSelectedCourseIds([]);
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error('Failed to publish book.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this book?')) return;
    try {
      await teacherApi.deleteBook(id);
      toast.success('Book deleted successfully.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete book.');
    }
  };

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading library catalogue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Manage Books
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Publish, edit, and assign textbook references and e-books to your batches.
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="bg-violet-650 hover:bg-violet-550 cursor-pointer flex items-center gap-1.5"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showAddForm ? 'Cancel' : 'Upload Book'}</span>
        </Button>
      </div>

      {showAddForm && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Publish New Book</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleCreateBook} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Book Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design Patterns" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Author</label>
                  <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Gang of Four" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short outline of textbook content" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Assign to Courses</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {courses.map(c => {
                    const isSelected = selectedCourseIds.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleCourseSelection(c.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {c.code}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Upload PDF/EPUB File</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 cursor-pointer text-xs font-semibold text-slate-300">
                    <Upload className="h-4 w-4 text-violet-400" />
                    <span>Choose File</span>
                    <input type="file" accept=".pdf,.epub" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {uploading && <RefreshCw className="h-4 w-4 animate-spin text-violet-500" />}
                  {fileUrl && <span className="text-xs text-emerald-400 font-medium truncate max-w-xs">{fileUrl}</span>}
                </div>
              </div>

              <Button type="submit" className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer mt-2">
                Publish Textbook
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {books.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
              <BookIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No books published</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Upload textbooks, e-books, or reference guides to share with your assigned courses.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Card key={book.id}>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md bg-violet-950/40 border border-violet-500/20 text-violet-400">
                  <BookIcon className="h-6 w-6" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1">
                    {book.courses.map((c: any) => (
                      <span key={c.id} className="text-[9px] font-bold text-violet-400 bg-violet-950/40 border border-violet-900/40 px-1.5 py-0.2 rounded uppercase">
                        {c.title}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 truncate">{book.title}</h3>
                  <p className="text-xs text-slate-500 font-medium truncate">By {book.author}</p>
                  <p className="text-xs text-slate-500 line-clamp-1 italic">{book.description}</p>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  {book.file_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`http://localhost:8000${book.file_url}`, '_blank')}
                      className="text-slate-400 hover:text-slate-250 cursor-pointer p-1.5"
                      aria-label="Download book"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(book.id)}
                    className="text-rose-450 hover:text-rose-350 cursor-pointer p-1.5"
                    aria-label="Delete book"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default Books;
