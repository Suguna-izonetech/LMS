import React, { useEffect, useState } from 'react';
import { FileText, BookOpen, Download, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';

interface Material {
  id: number;
  title: string;
  description: string;
  file_url: string;
  course_title: string;
  material_type: string;
}

interface BookItem {
  id: number;
  title: string;
  author: string;
  description: string;
  file_url: string;
}

interface RecordingItem {
  id: number;
  title: string;
  course_title: string;
  file_url: string;
  recorded_at: string;
}

export const StudyMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/materials');
      setMaterials(res.data.study_materials || []);
      setBooks(res.data.books || []);
      setRecordings(res.data.recordings || []);
    } catch (err) {
      console.error('Error fetching materials', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading course study materials & books..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          Study Materials & E-Books
        </h1>
        <p className="text-sm text-slate-400">
          Access handouts, slide decks, reference guides, and published course e-books.
        </p>
      </div>

      {/* Handouts & Study Notes */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <FileText className="h-5 w-5 text-sky-400" />
          <span>Course Handouts & Notes</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((mat) => (
            <Card key={mat.id} className="hover:border-sky-500/40 transition-all">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase">
                      {mat.material_type}
                    </span>
                    <span className="text-xs text-slate-500">{mat.course_title}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{mat.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{mat.description}</p>
                </div>

                <a
                  href={mat.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 transition-colors border border-slate-800"
                  title="View / Download Material"
                >
                  <Download className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* E-Books */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-400" />
          <span>Published E-Books</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((book) => (
            <Card key={book.id} className="hover:border-indigo-500/40 transition-all">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-indigo-400 font-semibold">{book.author}</span>
                  <h3 className="text-base font-bold text-slate-100">{book.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{book.description}</p>
                </div>

                <a
                  href={book.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 transition-colors border border-slate-800"
                  title="Read E-Book"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-rose-400" />
          <span>Class Recordings</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recordings.map((recording) => (
            <Card key={recording.id} className="hover:border-rose-500/40 transition-all">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-rose-400 font-semibold">{recording.course_title}</span>
                  <h3 className="text-base font-bold text-slate-100">{recording.title}</h3>
                  <p className="text-xs text-slate-500">{new Date(recording.recorded_at).toLocaleDateString()}</p>
                </div>
                <a
                  href={recording.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 transition-colors border border-slate-800"
                  title="Watch class recording"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
export default StudyMaterials;
