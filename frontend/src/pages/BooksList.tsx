import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Upload, Download, Trash2, Edit2, FileText } from 'lucide-react';
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

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  file_url: string;
  status: string;
  created_at: string;
}

export const BooksList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const { success, error: showError } = useToast();

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('published');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const res = await api.get('/institute-admin/books');
          setBooks(res.data);
          if (res.data.length === 0) setUiState('empty');
          else setUiState('normal');
      } catch (err) {
          console.error(err);
          showError('Failed to load books');
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // Filter lists
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteConfirm = async () => {
    if (selectedBook) {
      try {
          await api.delete(`/institute-admin/books/${selectedBook.id}`);
          fetchData();
          success('Book deleted successfully');
      } catch (err) {
          showError('Failed to delete book');
      }
      setIsDeleteOpen(false);
      setSelectedBook(null);
    }
  };

  const openCreateForm = () => {
    setIsEdit(false);
    setSelectedBook(null);
    setTitle('');
    setAuthor('');
    setDescription('');
    setStatus('published');
    setFile(null);
    setIsFormOpen(true);
  };

  const openEditForm = (book: Book) => {
    setIsEdit(true);
    setSelectedBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setDescription(book.description || '');
    setStatus(book.status);
    setFile(null); // Require re-upload if they want to change file
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) {
        showError("Title and Author are required.");
        return;
    }
    if (!isEdit && !file) {
        showError("E-Book file upload is required for new books.");
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('description', description);
    formData.append('status', status);
    if (file) {
        formData.append('file', file);
    }

    try {
        if (isEdit && selectedBook) {
            await api.put(`/institute-admin/books/${selectedBook.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            await api.post('/institute-admin/books', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        setIsFormOpen(false);
        success(`Book ${isEdit ? 'updated' : 'added'} successfully`);
        fetchData();
    } catch (e) {
        showError("Failed to save book.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Library & Books" description="Manage e-books for your students." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Books' }]} />} />
        <LoadingState message="Loading digital library..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Library & Books" description="Manage e-books for your students." breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Books' }]} />} />
        <ErrorState title="Failed to load library" message="Could not fetch books from the server." onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Digital Library (E-Books)"
          description="Upload and manage e-books mapped to academic programs."
          breadcrumbs={<Breadcrumb items={[{ label: 'Learning Manager' }, { label: 'Manage Books' }]} />}
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={openCreateForm}
            >
              Add New Book
            </Button>
          }
        />
      </div>

      {/* Filter panel */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Library</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by book title or author..."
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
        } = usePagination({ data: filteredBooks, itemsPerPage: 10 });

        if (filteredBooks.length === 0) {
          return (
            <EmptyState
              title="No Books Found"
              description="Your library is currently empty or no books match your search."
              actionLabel="Add E-Book"
              onActionClick={openCreateForm}
            />
          );
        }

        return (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Book Title & Author</TableHeaderCell>
                  <TableHeaderCell>Date Added</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map(b => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-indigo-400">
                        <BookOpen className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{b.title}</span>
                        <span className="text-xs text-slate-500">by {b.author}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 font-medium">
                    {new Date(b.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.status === 'published' ? 'success' : 'warning'}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a href={`http://localhost:8000${b.file_url}`} target="_blank" rel="noreferrer">
                          <Button variant="secondary" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
                            Download
                          </Button>
                      </a>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditForm(b)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedBook(b);
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

      {/* Delete confirm */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete "${selectedBook?.title}"? This cannot be undone.`}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteOpen(false)}
        variant="danger"
      />

      {/* Book Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEdit ? "Edit E-Book" : "Add New E-Book"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Book Title <span className="text-red-500">*</span></label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Advanced Mathematics Vol. 2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Author <span className="text-red-500">*</span></label>
            <Input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief summary of the book..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-300">Status</label>
             <Select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
             </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">E-Book File (PDF/EPUB) {isEdit ? "(Optional, overrides existing)" : "<span className='text-red-500'>*</span>"}</label>
            <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-800 border-dashed rounded-lg cursor-pointer bg-slate-950 hover:bg-slate-900">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileText className="w-8 h-8 mb-3 text-slate-500" />
                        <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-500">{file ? file.name : "No file selected"}</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.epub" onChange={(e) => {
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
              {isSubmitting ? 'Saving...' : 'Save Book'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BooksList;
