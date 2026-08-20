import React, { useEffect, useState } from 'react';
import { Share2, Plus, MessageSquare, Heart, Send, Trash2, RefreshCw, Upload, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { teacherApi } from '../../api/teacher';

export const Newsfeed: React.FC = () => {
  const toast = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  
  // Attachments form state
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await teacherApi.getNewsfeed();
      setPosts(res);
    } catch (err) {
      toast.error('Failed to load announcements feed.');
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
      setAttachmentUrls(prev => [...prev, res.file_url]);
      toast.success('Announcement attachment uploaded!');
    } catch (err) {
      toast.error('Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }

    try {
      await teacherApi.createNewsfeedPost({
        content,
        type: 'announcement',
        file_url: attachmentUrls[0] || null
      });
      toast.success('Announcement published successfully!');
      setContent('');
      setAttachmentUrls([]);
      loadData();
    } catch (err) {
      toast.error('Failed to publish post.');
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this post?')) return;
    try {
      await teacherApi.deleteNewsfeedPost(id);
      toast.success('Post deleted successfully.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete post.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading announcement feed...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          Announcements Newsfeed
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Broadcast reminders and check interactive updates from your students.
        </p>
      </div>

      {/* Write a Post Form */}
      <Card>
        <CardContent className="p-5">
          <form onSubmit={handlePost} className="space-y-3">
            <textarea
              className="w-full min-h-[80px] bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 placeholder-slate-600 resize-none font-medium"
              placeholder="Share an update or notice with your students..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 cursor-pointer text-xs font-semibold text-slate-400">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Add File</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
                {uploading && <RefreshCw className="h-3 w-3 animate-spin text-violet-500" />}
                {attachmentUrls.length > 0 && (
                  <span className="text-[10px] text-emerald-450 font-bold">
                    {attachmentUrls.length} file(s) attached
                  </span>
                )}
              </div>

              <Button type="submit" className="bg-violet-650 hover:bg-violet-550 cursor-pointer flex items-center gap-1.5 py-1.5 px-4 text-xs font-semibold">
                <Send className="h-3.5 w-3.5" />
                <span>Post Announcement</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold">
                    {post.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">{post.author_name}</h4>
                    <p className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">
                      {post.type} • {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePost(post.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-slate-350 leading-relaxed font-medium">{post.content}</p>

              {post.file_url && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-850/50">
                  <button
                    onClick={() => window.open(`http://localhost:8000${post.file_url}`, '_blank')}
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:underline text-left cursor-pointer hover:bg-transparent"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Attached Document</span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default Newsfeed;
