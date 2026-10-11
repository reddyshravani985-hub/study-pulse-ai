import React, { useState } from 'react';
import { 
  CheckSquare, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  BookOpen, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { api } from '../api';

export default function QuizView({
  activeDocument,
  onOpenUpload,
  showToast
}) {
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // question_id -> selected_option_index
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const optionLetters = ['A', 'B', 'C', 'D'];

  const handleGenerateQuiz = async () => {
    if (!activeDocument) return;

    setErrorMsg('');
    setGenerating(true);
    setQuizResult(null);
    setUserAnswers({});
    setCurrentIndex(0);

    try {
      const data = await api.generateQuiz(activeDocument.id, numQuestions, difficulty);
      setQuizData(data);
      showToast(`Quiz with ${data.total_questions} questions generated!`, 'success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate quiz');
      showToast(err.message || 'Quiz generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    if (quizResult) return; // Prevent change after submission
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;

    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < quizData.questions.length) {
      if (!confirm(`You have answered ${answeredCount} of ${quizData.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const answersList = quizData.questions.map(q => ({
        question_id: q.id,
        selected_option_index: userAnswers[q.id] !== undefined ? userAnswers[q.id] : null
      }));

      const result = await api.submitQuiz(quizData.quiz_id, answersList);
      setQuizResult(result);
      showToast(`Quiz completed! Score: ${result.score}/${result.total_questions} (${result.percentage}%)`, 'success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit quiz');
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setUserAnswers({});
    setQuizResult(null);
    setCurrentIndex(0);
    showToast('Quiz reset. Good luck!', 'info');
  };

  if (!activeDocument) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Select Study Material First</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please upload your PDF study notes or choose an active document from your dashboard to generate practice quizzes.
        </p>
        <button
          onClick={onOpenUpload}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all inline-flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Choose Document
        </button>
      </div>
    );
  }

  // --- STATE 1: QUIZ RESULTS VIEW ---
  if (quizResult) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* Score Card Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
                <Award className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-white">Quiz Completed!</h1>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm">
                    Grade {quizResult.grade_letter}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1">{quizResult.feedback}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Source: <span className="text-slate-200">{activeDocument.filename}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-slate-850/80 px-6 py-4 rounded-2xl border border-slate-700/80">
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium">Score</p>
                <p className="text-2xl font-black text-white mt-0.5">
                  {quizResult.score} / {quizResult.total_questions}
                </p>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium">Percentage</p>
                <p className="text-2xl font-black text-indigo-400 mt-0.5">
                  {quizResult.percentage}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap gap-3">
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Quiz
            </button>
            <button
              onClick={() => {
                setQuizData(null);
                setQuizResult(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate New Quiz
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Detailed Question Review & Explanations
          </h2>

          <div className="space-y-4">
            {quizResult.details.map((q, idx) => (
              <div
                key={q.question_id}
                className={`p-6 rounded-2xl border transition-all ${
                  q.is_correct
                    ? 'bg-slate-900/80 border-emerald-500/30 shadow-sm'
                    : 'bg-slate-900/80 border-red-500/30 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white leading-relaxed">
                        {q.question}
                      </h3>
                      {q.source_page && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-medium">
                          <BookOpen className="w-3 h-3 text-indigo-400" />
                          Source: Page {q.source_page}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${
                    q.is_correct
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-950/60 text-red-300 border border-red-500/40'
                  }`}>
                    {q.is_correct ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {q.is_correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = q.selected_option_index === optIdx;
                    const isCorrect = q.correct_answer_index === optIdx;

                    let optClass = 'bg-slate-800/40 border-slate-700/60 text-slate-300';
                    if (isCorrect) {
                      optClass = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      optClass = 'bg-red-950/40 border-red-500/60 text-red-200 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${optClass}`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                          isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {optionLetters[optIdx]}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                  <p className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Explanation
                  </p>
                  <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // --- STATE 2: ACTIVE QUIZ IN-PROGRESS ---
  if (quizData) {
    const currentQuestion = quizData.questions[currentIndex];
    const totalQuestions = quizData.questions.length;
    const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* Progress & Nav Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-400">Question {currentIndex + 1} of {totalQuestions}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-semibold text-[10px] border border-slate-700">
                {quizData.difficulty}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{quizData.document_name}</p>
          </div>

          {/* Dots Indicator */}
          <div className="hidden sm:flex items-center gap-1.5">
            {quizData.questions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                      : isAnswered
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Grading...
              </>
            ) : (
              'Submit Quiz'
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Current Question Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div>
            {currentQuestion.topic && (
              <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                {currentQuestion.topic}
              </span>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-white mt-3 leading-snug">
              {currentQuestion.question}
            </h2>
          </div>

          {/* 4 Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((optionText, optIdx) => {
              const isSelected = userAnswers[currentQuestion.id] === optIdx;

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 scale-[1.005]'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}
                  >
                    {optionLetters[optIdx]}
                  </span>
                  <span className="text-sm flex-1 leading-relaxed">{optionText}</span>
                </div>
              );
            })}
          </div>

          {/* Nav buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <span className="text-xs text-slate-500">
              {Object.keys(userAnswers).length} of {totalQuestions} answered
            </span>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
              >
                Finish & Submit
              </button>
            )}
          </div>
        </div>

      </div>
    );
  }

  // --- STATE 3: QUIZ GENERATOR CONFIG SCREEN ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Configuration Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
        <div className="max-w-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Practice Quiz Arena</h1>
          <p className="text-sm text-slate-300/90 mt-2 leading-relaxed">
            Generate multiple-choice assessment questions from <strong className="text-white">"{activeDocument.filename}"</strong>. Each question includes 4 plausible options, instant grading, and in-depth rationales.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            {errorMsg}
          </div>
        )}

        {/* Configuration Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-800">
          
          {/* Question Count */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Number of Questions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setNumQuestions(count)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    numQuestions === count
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'easy', label: 'Easy' },
                { id: 'medium', label: 'Medium' },
                { id: 'hard', label: 'Hard' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setDifficulty(lvl.id)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    difficulty === lvl.id
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Generate Button */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleGenerateQuiz}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Crafting Quiz Questions...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Practice Quiz
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
