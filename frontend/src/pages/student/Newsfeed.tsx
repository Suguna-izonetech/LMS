import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';

interface NewsfeedPost {
  id: number;
  title: string | null;
  content: string;
  type: string;
  file_url: string | null;
  author_name: string;
  created_at: string;
}

export const StudentNewsfeed: React.FC = () => {
  const [posts, setPosts] = useState<NewsfeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/newsfeed')
      .then((response) => setPosts(response.data))
      .catch((error) => console.error('Error fetching student newsfeed', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading institute announcements..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">Institute Newsfeed</h1>
        <p className="text-sm text-slate-400">Read announcements and learning updates from teachers and institute administrators.</p>
      </div>
      {posts.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-500">No announcements have been published yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">{post.type}</p>
                    <h2 className="text-lg font-bold text-slate-100">{post.title || 'Institute Update'}</h2>
                  </div>
                  <Megaphone className="h-5 w-5 shrink-0 text-sky-400" />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{post.content}</p>
                {post.file_url && <a className="text-sm font-semibold text-sky-400 hover:text-sky-300" href={post.file_url} target="_blank" rel="noopener noreferrer">Open attachment</a>}
                <p className="text-xs text-slate-500">Posted by {post.author_name} on {new Date(post.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNewsfeed;
