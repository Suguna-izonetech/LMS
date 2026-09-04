import React, { useEffect, useState } from 'react';
import { HelpCircle, Clock, CheckCircle2, Award, Play } from 'lucide-react';
import api from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { useToast } from '../../context/ToastContext';

interface QuizItem {
  id: number;
  title: string;
  description: string;
  course_title: string;
  duration_minutes: number;
  total_marks: number;
  attempted: boolean;
  score: number | null;
  attempt_status: string;
}

interface QuestionOption {
  id: number;
  option_text: string;
}

interface Question {
  id: number;
  question_text: string;
  marks: number;
  options: QuestionOption[];
}

interface ActiveQuiz {
  id: number;
  title: string;
  duration_minutes: number;
  total_marks: number;
  questions: Question[];
}

export const Quizzes: React.FC = () => {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/quizzes');
      setQuizzes(res.data);
    } catch (err) {
      console.error('Error fetching quizzes', err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quizId: number) => {
    try {
      const res = await api.get(`/student/quizzes/${quizId}`);
      setActiveQuiz(res.data);
      setSelectedAnswers({});
    } catch (err) {
      toast.error('Failed to load quiz questions.');
    }
  };

  const handleSelectOption = (questionId: number, optionId: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    setSubmitting(true);
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qId, oId]) => ({
        question_id: parseInt(qId),
        selected_option_id: oId
      }));

      const res = await api.post(`/student/quizzes/${activeQuiz.id}/submit`, {
        answers: answersPayload
      });

      toast.success(`Quiz submitted! Score: ${res.data.score}/${res.data.total_marks}`);
      setActiveQuiz(null);
      fetchQuizzes();
    } catch (err) {
      toast.error('Error submitting quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading course quizzes..." />;
  }

  // Active Quiz Examination View
  if (activeQuiz) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Active Examination</span>
            <h1 className="text-xl font-bold text-slate-100">{activeQuiz.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg">
              <Clock className="h-4 w-4 text-sky-400" />
              <span>{activeQuiz.duration_minutes} Minutes</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg">
              <Award className="h-4 w-4 text-amber-400" />
              <span>{activeQuiz.total_marks} Total Marks</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {activeQuiz.questions.map((q, qIndex) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-100 flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-400 text-xs">
                    Q{qIndex + 1}
                  </span>
                  <span>{q.question_text}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((opt) => {
                  const isSelected = selectedAnswers[q.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`
                        w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer
                        ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500 text-sky-300 font-semibold'
                            : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                        }
                      `}
                    >
                      <span>{opt.option_text}</span>
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-sky-400 bg-sky-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-900">
          <Button variant="ghost" onClick={() => setActiveQuiz(null)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitQuiz}
            isLoading={submitting}
            className="bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-900/30 cursor-pointer"
          >
            Submit Quiz Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
          Course Quizzes & Assessments
        </h1>
        <p className="text-sm text-slate-400">
          Attempt published quizzes, test your knowledge, and view immediate scores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:border-sky-500/40 transition-all flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[11px] font-bold uppercase">
                  {quiz.course_title}
                </span>
                {quiz.attempted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                    Available
                  </span>
                )}
              </div>
              <CardTitle className="text-lg font-bold text-slate-100">{quiz.title}</CardTitle>
              <CardDescription className="text-xs text-slate-400 line-clamp-2">{quiz.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between text-xs text-slate-400 py-2 border-y border-slate-900">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-sky-400" />
                  <span>{quiz.duration_minutes} Mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>{quiz.total_marks} Marks</span>
                </div>
                {quiz.score !== null && (
                  <div className="font-bold text-emerald-400">
                    Score: {quiz.score} / {quiz.total_marks}
                  </div>
                )}
              </div>

              {!quiz.attempted ? (
                <Button
                  onClick={() => startQuiz(quiz.id)}
                  className="w-full bg-sky-600 hover:bg-sky-500 shadow-sm cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current mr-2" />
                  <span>Start Quiz Now</span>
                </Button>
              ) : (
                <Button variant="ghost" disabled className="w-full text-slate-500 border border-slate-800">
                  Quiz Submitted
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default Quizzes;
