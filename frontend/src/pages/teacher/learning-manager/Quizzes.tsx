import React, { useEffect, useState } from 'react';
import { HelpCircle, Plus, FileQuestion, ArrowRight, ArrowLeft, RefreshCw, Trash2, Check, X, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../context/ToastContext';
import { teacherApi } from '../../../api/teacher';

export const Quizzes: React.FC = () => {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Selected Quiz details
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [detailTab, setDetailTab] = useState<'questions' | 'attempts'>('questions');
  const [detailLoading, setDetailLoading] = useState(false);

  // Create Quiz Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [duration, setDuration] = useState(30);
  const [totalMarks, setTotalMarks] = useState(100);

  // New Question Form
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionMarks, setNewQuestionMarks] = useState(10);
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizzesRes, coursesRes] = await Promise.all([
        teacherApi.getQuizzes(),
        teacherApi.getCourses()
      ]);
      setQuizzes(quizzesRes);
      setCourses(coursesRes);
      if (coursesRes.length > 0) {
        setSelectedCourseId(String(coursesRes[0].id));
      }
    } catch (err) {
      toast.error('Failed to load quizzes list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenQuizDetails = async (id: number) => {
    try {
      setDetailLoading(true);
      const [details, attemptsRes] = await Promise.all([
        teacherApi.getQuiz(id),
        teacherApi.getQuizAttempts(id)
      ]);
      setQuizDetails(details);
      setAttempts(attemptsRes);
      setSelectedQuizId(id);
    } catch (err) {
      toast.error('Failed to load quiz details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedCourseId) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      await teacherApi.createQuiz({
        title,
        description,
        course_id: Number(selectedCourseId),
        duration_minutes: Number(duration),
        total_marks: Number(totalMarks)
      });
      toast.success('Quiz draft created successfully!');
      setTitle('');
      setDescription('');
      setDuration(30);
      setTotalMarks(100);
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error('Failed to create quiz.');
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionText) {
      toast.error('Question text is required.');
      return;
    }
    const correctCount = options.filter(o => o.isCorrect).length;
    if (correctCount === 0) {
      toast.error('Please select at least one correct option.');
      return;
    }

    const newQuestion = {
      question_text: newQuestionText,
      marks: Number(newQuestionMarks),
      options: options.map(o => ({ option_text: o.text || 'Option', is_correct: o.isCorrect }))
    };

    const updatedQuestions = [...(quizDetails.questions || []), newQuestion];
    setQuizDetails({ ...quizDetails, questions: updatedQuestions });
    
    // Reset Form
    setNewQuestionText('');
    setNewQuestionMarks(10);
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]);
  };

  const handleSaveQuestions = async () => {
    if (!selectedQuizId) return;
    try {
      const payload = quizDetails.questions.map((q: any) => ({
        question_text: q.question_text,
        marks: q.marks,
        options: q.options.map((o: any) => ({
          option_text: o.option_text,
          is_correct: o.is_correct
        }))
      }));
      await teacherApi.saveQuizQuestions(selectedQuizId, payload);
      toast.success('Quiz questions saved successfully!');
      handleOpenQuizDetails(selectedQuizId);
    } catch (err) {
      toast.error('Failed to save quiz questions.');
    }
  };

  const handleOptionChange = (idx: number, field: string, val: any) => {
    setOptions(prev =>
      prev.map((opt, i) => {
        if (i === idx) {
          return { ...opt, [field]: val };
        }
        // If marking correct, make others false (for single choice)
        if (field === 'isCorrect' && val === true) {
          return { ...opt, isCorrect: i === idx };
        }
        return opt;
      })
    );
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await teacherApi.deleteQuiz(id);
      toast.success('Quiz deleted.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete quiz.');
    }
  };

  const handlePublishQuiz = async () => {
    if (!selectedQuizId) return;
    try {
      await teacherApi.updateQuiz(selectedQuizId, { status: 'published' });
      toast.success('Quiz published live to students!');
      handleOpenQuizDetails(selectedQuizId);
    } catch (err) {
      toast.error('Failed to publish quiz.');
    }
  };

  if (loading || detailLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm font-semibold text-slate-400">Loading quiz data...</p>
      </div>
    );
  }

  // --- SUBVIEW: QUIZ BUILDER DETAIL VIEW ---
  if (selectedQuizId && quizDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSelectedQuizId(null); loadData(); }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Quizzes</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-850 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                quizDetails.status === 'published' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {quizDetails.status}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">{quizDetails.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{quizDetails.description || 'No description provided.'}</p>
          </div>

          <div className="flex items-center gap-2.5">
            {quizDetails.status !== 'published' && (
              <Button onClick={handlePublishQuiz} className="bg-emerald-600 hover:bg-emerald-500">
                Publish Live
              </Button>
            )}
            <Button onClick={handleSaveQuestions} className="bg-violet-600 hover:bg-violet-500 flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              <span>Save Questions</span>
            </Button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex gap-2 border-b border-slate-850 pb-2">
          <button
            onClick={() => setDetailTab('questions')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              detailTab === 'questions' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Questions ({quizDetails.questions?.length || 0})
          </button>
          <button
            onClick={() => setDetailTab('attempts')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              detailTab === 'attempts' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Student Attempts ({attempts.length})
          </button>
        </div>

        {/* Content Tabs */}
        {detailTab === 'questions' ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Questions List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-300">Active Questionnaire</h3>
              {(!quizDetails.questions || quizDetails.questions.length === 0) ? (
                <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
                  No questions created yet. Use the sidebar builder to append questions.
                </div>
              ) : (
                quizDetails.questions.map((q: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-sm font-bold text-slate-200">
                          {idx + 1}. {q.question_text}
                        </h4>
                        <span className="text-[10px] font-bold text-violet-400 bg-violet-950/20 px-2 py-0.5 rounded shrink-0">
                          {q.marks} Marks
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {q.options.map((o: any, oIdx: number) => (
                          <div key={oIdx} className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            o.is_correct ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' : 'bg-slate-900/60 border-slate-850 text-slate-400'
                          }`}>
                            <span>{o.option_text}</span>
                            {o.is_correct && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Question Builder Form */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Add Question</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-450">Question Prompt</label>
                    <Input value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} placeholder="e.g. Which hook triggers on updates?" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-450">Marks Mapped</label>
                    <Input type="number" value={newQuestionMarks} onChange={(e) => setNewQuestionMarks(Number(e.target.value))} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-450 block">Options & Correct Indicator</label>
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={opt.isCorrect}
                          onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                          className="rounded border-slate-800 text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                        <Input
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="text-xs py-1"
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={handleAddQuestion} className="w-full bg-violet-600 hover:bg-violet-500">
                    Append Question
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-450 uppercase tracking-wider bg-slate-900/40 font-bold">
                      <th className="p-4 pl-6">Student Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 text-center">Score</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 pr-6 text-right">Completed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {attempts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-550">No submissions recorded for this quiz.</td>
                      </tr>
                    ) : (
                      attempts.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-900/20 text-slate-300">
                          <td className="p-4 pl-6 font-bold text-slate-200">{att.student_name}</td>
                          <td className="p-4 text-slate-500">{att.email}</td>
                          <td className="p-4 text-center font-bold text-slate-200">
                            {att.score} / {quizDetails.total_marks}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              att.status === 'completed' ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/20' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right text-slate-550">
                            {att.completed_at ? new Date(att.completed_at).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // --- MAIN VIEW: QUIZZES GRID ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
            Quizzes
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Create, publish, and view test attempts for your active courses.
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-violet-650 hover:bg-violet-550 cursor-pointer flex items-center gap-1.5"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showAddForm ? 'Cancel' : 'Create Quiz'}</span>
        </Button>
      </div>

      {showAddForm && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Create New Quiz</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Course Mapping</label>
                  <Select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    options={courses.map(c => ({ value: String(c.id), label: c.title }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Quiz Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm Evaluation" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes or rules about the test" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Duration (Minutes)</label>
                  <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Total Marks</label>
                  <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
                </div>
              </div>

              <Button type="submit" className="w-full bg-violet-650 hover:bg-violet-550 cursor-pointer mt-2">
                Create Quiz Draft
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
              <FileQuestion className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No quizzes created</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Create online multiple-choice quizzes, set timers, and build question banks for your batches.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider ${
                  quiz.status === 'published' ? 'bg-emerald-950 text-emerald-455 border border-emerald-900/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {quiz.status}
                </span>
                <FileQuestion className="h-4 w-4 text-violet-400" />
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider block mb-1">
                    {quiz.course_title}
                  </span>
                  <h3 className="text-sm font-bold text-slate-200 line-clamp-1">{quiz.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{quiz.question_count} Questions • {quiz.duration_minutes} mins</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-850">
                  <Button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    variant="ghost"
                    size="sm"
                    className="text-rose-450 hover:text-rose-350 p-0 hover:bg-transparent"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenQuizDetails(quiz.id)}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 p-0 cursor-pointer hover:bg-transparent"
                  >
                    <span>Build & Review</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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
export default Quizzes;
