import React, { useState, useEffect } from 'react';
import { Rss, Image as ImageIcon, Send, Clock, Trash2, Edit2, MessageSquare, ThumbsUp, PlusCircle, CheckCircle2 } from 'lucide-react';
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
  Modal,
  Tabs,
  Pagination
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

interface NewsfeedPost {
  id: number;
  title: string;
  content: string;
  post_type: string;
  status: string;
  image_url: string | null;
  created_at: string;
  author_name: string;
  likes_count: number;
  comments_count: number;
}

export const NewsfeedList: React.FC = () => {
  const [posts, setPosts] = useState<NewsfeedPost[]>([]);
  const [uiState, setUiState] = useState<'normal' | 'loading' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');
  const { success, error: showError } = useToast();

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<NewsfeedPost | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('Announcement');
  const [status, setStatus] = useState('Published');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
      setUiState('loading');
      try {
          const res = await api.get('/institute-admin/social/newsfeed');
          setPosts(res.data);
          setUiState('normal');
      } catch (err) {
          console.error(err);
          showError("Failed to load newsfeed data");
          setUiState('error');
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const openForm = (p?: NewsfeedPost) => {
      if (p) {
          setSelectedPost(p);
          setTitle(p.title);
          setContent(p.content);
          setPostType(p.post_type);
          setStatus(p.status);
      } else {
          setSelectedPost(null);
          setTitle('');
          setContent('');
          setPostType('Announcement');
          setStatus('Published');
      }
      setFile(null);
      setIsFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setFile(e.target.files[0]);
      }
  };
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
        showError("Title and Content are required.");
        return;
    }

    setIsSubmitting(true);

    try {
        if (selectedPost) {
            // Edit existing (only metadata supported for edit in this simplified version)
            const payload = {
                title, content, post_type: postType, status
            };
            await api.put(`/institute-admin/social/newsfeed/${selectedPost.id}`, payload);
        } else {
            // Create new
            const formData = new FormData();
            formData.append('data', JSON.stringify({ title, content, post_type: postType, status }));
            if (file) {
                formData.append('file', file);
            }
            await api.post('/institute-admin/social/newsfeed', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        setIsFormOpen(false);
        success(`Post ${selectedPost ? 'updated' : 'created'} successfully`);
        fetchData();
    } catch (e: any) {
        showError(e.response?.data?.detail || "Failed to save post.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
      if (!selectedPost) return;
      try {
          await api.delete(`/institute-admin/social/newsfeed/${selectedPost.id}`);
          setIsDeleteOpen(false);
          success("Post deleted successfully");
          fetchData();
      } catch (e: any) {
          showError("Failed to delete post.");
      }
  };
  
  const togglePublishStatus = async (p: NewsfeedPost) => {
      const newStatus = p.status === 'Published' ? 'Draft' : 'Published';
      try {
          await api.put(`/institute-admin/social/newsfeed/${p.id}`, { status: newStatus });
          success(`Post status updated to ${newStatus}`);
          fetchData();
      } catch (e) {
          showError("Failed to update status");
      }
  };

  if (uiState === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Newsfeed" description="Manage social announcements." breadcrumbs={<Breadcrumb items={[{ label: 'Social Connect' }, { label: 'Newsfeed' }]} />} />
        <LoadingState message="Loading social feed..." />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Newsfeed" description="Manage social announcements." breadcrumbs={<Breadcrumb items={[{ label: 'Social Connect' }, { label: 'Newsfeed' }]} />} />
        <ErrorState title="Failed to load module" message="Could not fetch data from the server." onRetry={fetchData} />
      </div>
    );
  }
  
  const publishedPosts = posts.filter(p => p.status === 'Published');
  const draftPosts = posts.filter(p => p.status === 'Draft');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Social Newsfeed"
          description="Broadcast announcements, educational content, and community updates."
          breadcrumbs={<Breadcrumb items={[{ label: 'Social Connect' }, { label: 'Newsfeed' }]} />}
          actions={
              <Button variant="primary" size="sm" onClick={() => openForm()} leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create Post
              </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as any)}
              items={[
                  { id: 'published', label: `Published Feed (${publishedPosts.length})` },
                  { id: 'drafts', label: `Drafts (${draftPosts.length})` }
              ]}
              className="w-full border-b border-slate-800 bg-slate-900/50 p-4 pb-0"
          />
          
          <div className="p-6">
            {activeTab === 'published' && (
                <>
                  {publishedPosts.length === 0 ? (
                        <EmptyState title="No Published Posts" description="Your community newsfeed is empty." icon={<Rss className="w-12 h-12 text-slate-700" />} />
                    ) : (() => {
                          const {
                            paginatedData: paginatedPublished,
                            currentPage: publishedPage,
                            totalPages: publishedTotalPages,
                            startIndex: publishedStartIndex,
                            endIndex: publishedEndIndex,
                            totalItems: publishedTotalItems,
                            goToPage: goToPublishedPage,
                            nextPage: nextPublishedPage,
                            prevPage: prevPublishedPage
                          } = usePagination({ data: publishedPosts, itemsPerPage: 6 });

                          return (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedPublished.map(p => (
                                <Card key={p.id} className="overflow-hidden bg-slate-900 border-slate-800 flex flex-col">
                                    {p.image_url && (
                                        <div className="h-40 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                                            <img src={`http://localhost:8000${p.image_url}`} alt="Post cover" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}
                                    <CardContent className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={p.post_type === 'Announcement' ? 'danger' : p.post_type === 'Educational Content' ? 'info' : 'success'}>
                                                {p.post_type}
                                            </Badge>
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-200 mb-2 line-clamp-2">{p.title}</h3>
                                        <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">{p.content}</p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-auto">
                                            <div className="flex gap-4 text-slate-500">
                                                <span className="flex items-center gap-1.5 text-xs hover:text-indigo-400 transition-colors cursor-pointer">
                                                    <ThumbsUp className="w-4 h-4" /> {p.likes_count}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs hover:text-indigo-400 transition-colors cursor-pointer">
                                                    <MessageSquare className="w-4 h-4" /> {p.comments_count}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => togglePublishStatus(p)} title="Unpublish" className="p-1.5 text-slate-400 hover:text-amber-400 rounded-md hover:bg-slate-800 transition-colors">
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openForm(p)} className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setSelectedPost(p); setIsDeleteOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                          <div className="mt-6">
                            <Pagination
                                currentPage={publishedPage}
                                totalPages={publishedTotalPages}
                                startIndex={publishedStartIndex}
                                endIndex={publishedEndIndex}
                                totalItems={publishedTotalItems}
                                onPageChange={goToPublishedPage}
                                onNext={nextPublishedPage}
                                onPrev={prevPublishedPage}
                            />
                          </div>
                        </>
                          );
                        })()
                    }
                        </>
                    )}
            
            {activeTab === 'drafts' && (
                <>
                  {draftPosts.length === 0 ? (
                        <EmptyState title="No Drafts" description="You have no drafts waiting to be published." icon={<Edit2 className="w-12 h-12 text-slate-700" />} />
                    ) : (() => {
                          const {
                            paginatedData: paginatedDrafts,
                            currentPage: draftsPage,
                            totalPages: draftsTotalPages,
                            startIndex: draftsStartIndex,
                            endIndex: draftsEndIndex,
                            totalItems: draftsTotalItems,
                            goToPage: goToDraftsPage,
                            nextPage: nextDraftsPage,
                            prevPage: prevDraftsPage
                          } = usePagination({ data: draftPosts, itemsPerPage: 6 });

                          return (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedDrafts.map(p => (
                                <Card key={p.id} className="overflow-hidden bg-slate-900 border-dashed border-2 border-slate-800 flex flex-col opacity-70 hover:opacity-100 transition-opacity">
                                    <CardContent className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="neutral">Draft</Badge>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-200 mb-2">{p.title}</h3>
                                        <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">{p.content}</p>
                                        
                                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/50 mt-auto">
                                            <Button variant="primary" size="sm" onClick={() => togglePublishStatus(p)} leftIcon={<Send className="w-3.5 h-3.5" />}>
                                                Publish Now
                                            </Button>
                                            <button onClick={() => openForm(p)} className="p-2 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { setSelectedPost(p); setIsDeleteOpen(true); }} className="p-2 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                          <div className="mt-6">
                            <Pagination
                                currentPage={draftsPage}
                                totalPages={draftsTotalPages}
                                startIndex={draftsStartIndex}
                                endIndex={draftsEndIndex}
                                totalItems={draftsTotalItems}
                                onPageChange={goToDraftsPage}
                                onNext={nextDraftsPage}
                                onPrev={prevDraftsPage}
                            />
                          </div>
                        </>
                          );
                        })()
                    }
                        </>
                    )}
          </div>
        </CardContent>
      </Card>

      {/* POST COMPOSER MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedPost ? "Edit Post" : "Compose Newsfeed Post"} size="lg">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Post Title <span className="text-red-500">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Catchy headline..." />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Post Category <span className="text-red-500">*</span></label>
                 <Select value={postType} onChange={e => setPostType(e.target.value)}>
                    <option value="Announcement">Announcement</option>
                    <option value="Educational Content">Educational Content</option>
                    <option value="Community Update">Community Update</option>
                 </Select>
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-300">Publishing Status <span className="text-red-500">*</span></label>
                 <Select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Published">Publish Immediately</option>
                    <option value="Draft">Save as Draft</option>
                 </Select>
              </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Content Body <span className="text-red-500">*</span></label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" placeholder="Write your post content here..." />
          </div>
          
          {!selectedPost && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Attach Image (Optional)</label>
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-800 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-800 hover:border-indigo-500/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-8 h-8 mb-3 text-slate-500" />
                            <p className="mb-2 text-sm text-slate-400">
                                {file ? <span className="text-emerald-400 font-semibold">{file.name}</span> : <><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</>}
                            </p>
                            <p className="text-xs text-slate-500">PNG, JPG, or WEBP (MAX. 5MB)</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
              </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} leftIcon={status === 'Published' ? <Send className="w-4 h-4" /> : <Clock className="w-4 h-4" />}>
                {isSubmitting ? 'Saving...' : status === 'Published' ? 'Broadcast Post' : 'Save Draft'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to permanently delete this post? This action cannot be undone."
        confirmLabel="Delete Post"
        variant="danger"
      />

    </div>
  );
};

export default NewsfeedList;
