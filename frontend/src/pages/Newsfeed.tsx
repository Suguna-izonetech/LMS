import React, { useState } from 'react';
import { Image as ImageIcon, Send, MessageSquare, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMockDb } from '../context/MockDbContext';
import {
  PageHeader,
  Breadcrumb,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select
} from '../components/ui';

const PRESET_POST_IMAGES = [
  { label: 'Coding Workspace', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&q=80' },
  { label: 'Abstract Gradients', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=500&q=80' },
  { label: 'Analytics Chart', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80' }
];

export const Newsfeed: React.FC = () => {
  const { currentRole } = useApp();
  const { posts, addPost, addComment, likePost } = useMockDb();

  // Create post states
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<'Announcement' | 'Educational' | 'Community'>('Community');
  const [postImage, setPostImage] = useState('');
  
  // Comment states
  const [activeCommentTexts, setActiveCommentTexts] = useState<Record<string, string>>({});

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    addPost(postContent, postCategory, postImage || undefined);

    setPostContent('');
    setPostImage('');
    setPostCategory('Community');
  };

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleCommentSubmit = (postId: string) => {
    const text = activeCommentTexts[postId];
    if (!text || !text.trim()) return;

    addComment(postId, text);
    setActiveCommentTexts(prev => ({ ...prev, [postId]: '' }));
  };

  const handleCommentTextChange = (postId: string, val: string) => {
    setActiveCommentTexts(prev => ({ ...prev, [postId]: val }));
  };

  // Find announcements to pin on sidebar
  const announcements = posts.filter(p => p.category === 'Announcement').slice(0, 3);

  const feedCategoryOptions = [
    { value: 'Community', label: 'Community Feed' },
    { value: 'Educational', label: 'Educational Tip' },
    ...(currentRole !== 'Student' ? [{ value: 'Announcement', label: 'Announcement 📢' }] : [])
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institute Newsfeed"
        description="Share announcements, post coding tips, and discuss course activities with the community."
        breadcrumbs={<Breadcrumb items={[{ label: 'Social Connect' }, { label: 'Newsfeed' }]} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Post Card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <form onSubmit={handleCreatePost} className="space-y-3.5">
                <textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="What's happening in the academy? Share announcements or learning resources..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none transition-colors"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category */}
                    <div className="w-[140px]">
                      <Select
                        value={postCategory}
                        onChange={e => setPostCategory(e.target.value as any)}
                        options={feedCategoryOptions}
                      />
                    </div>

                    {/* Image preset options */}
                    <div className="flex gap-1">
                      {PRESET_POST_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPostImage(img.url)}
                          className={`h-8.5 px-2.5 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer ${postImage === img.url ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-950 border-slate-855 text-slate-500 hover:border-slate-800'}`}
                          title={`Attach preset image: ${img.label}`}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                      {postImage && (
                        <button
                          type="button"
                          onClick={() => setPostImage('')}
                          className="h-8.5 px-2.5 text-[10px] font-bold bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg cursor-pointer"
                        >
                          Clear Image
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                    disabled={!postContent.trim()}
                  >
                    Post to Feed
                  </Button>
                </div>

                {/* Attached Image preview */}
                {postImage && (
                  <div className="relative aspect-video max-h-[160px] rounded-lg overflow-hidden border border-slate-850 bg-slate-950 mt-2">
                    <img src={postImage} alt="Attached upload" className="w-full h-full object-cover" />
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Posts Feed Timeline */}
          <div className="space-y-4">
            {posts.map(post => {
              const hasLiked = post.likedByMe;
              const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=4F46E5&color=fff`;
              
              return (
                <Card key={post.id}>
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarUrl}
                          alt={post.author}
                          className="w-9 h-9 rounded-full object-cover border border-slate-800"
                        />
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs font-bold text-slate-200">{post.author}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{post.role} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <Badge variant={post.category === 'Announcement' ? 'danger' : post.category === 'Educational' ? 'success' : 'info'}>
                        {post.category}
                      </Badge>
                    </div>

                    {/* Content */}
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    {/* Image Body */}
                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-850 bg-slate-955 aspect-video max-h-[280px]">
                        <img src={post.imageUrl} alt="Post content file" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center gap-4 text-slate-500 border-t border-b border-slate-900 py-2 text-xs">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 font-bold cursor-pointer transition-colors ${hasLiked ? 'text-rose-500' : 'hover:text-slate-355'}`}
                      >
                        <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes} Likes</span>
                      </button>

                      <div className="flex items-center gap-1.5 font-semibold">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments.length} Comments</span>
                      </div>
                    </div>

                    {/* Comments section */}
                    <div className="space-y-3.5 pt-1">
                      {post.comments.map(c => {
                        const commentAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author)}&background=1E293B&color=fff`;
                        return (
                          <div key={c.id} className="flex gap-2.5 items-start text-xs bg-slate-955 p-2.5 rounded-xl border border-slate-900/60">
                            <img src={commentAvatar} alt={c.author} className="w-7 h-7 rounded-full object-cover border border-slate-800 shrink-0" />
                            <div className="flex-1 space-y-0.5 leading-tight">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-200">{c.author}</span>
                                <span className="text-[9px] text-slate-550">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-slate-400 font-medium leading-relaxed">{c.content}</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Comment Input */}
                      <div className="flex gap-2 pt-1.5">
                        <Input
                          placeholder="Write an educational comment or reply..."
                          value={activeCommentTexts[post.id] || ''}
                          onChange={e => handleCommentTextChange(post.id, e.target.value)}
                          className="h-8.5 text-xs"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleCommentSubmit(post.id);
                          }}
                        />
                        <Button
                          variant="secondary"
                          className="h-8.5"
                          onClick={() => handleCommentSubmit(post.id)}
                          disabled={!(activeCommentTexts[post.id] || '').trim()}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Pinned Announcements */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pinned Announcements 📢</span>
              
              {announcements.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-550 italic font-semibold">No recent announcements pinned.</div>
              ) : (
                <div className="space-y-3">
                  {announcements.map(ann => (
                    <div key={ann.id} className="p-3 bg-red-955 border border-red-900/20 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Official</span>
                        <span className="text-[9px] text-slate-550 font-bold">{new Date(ann.createdAt).toLocaleDateString([], { dateStyle: 'short' })}</span>
                      </div>
                      <p className="text-xs text-slate-350 leading-relaxed truncate font-medium">{ann.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardContent className="p-4 space-y-3.5 text-xs text-slate-400 leading-relaxed">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Academy Feed Conduct</span>
              <ul className="space-y-2 list-disc list-inside">
                <li>Keep discussions relevant to technical courses.</li>
                <li>Share code snippets using proper markdown formatting.</li>
                <li>Spamming or self-promotional campaigns will result in CRM status suspensions.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Newsfeed;
