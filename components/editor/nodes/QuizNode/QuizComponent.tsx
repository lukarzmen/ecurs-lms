import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

export interface Test {
  question: string;
  answers: string[];
  correctAnswerIndex: number | null;
  correctAnswerDescription: string | null;
}

interface QuizComponentProps {
  tests: Test[];
  onComplete: () => void;
  successThreshold?: number; // Optional, default to 0.7 if not provided
}

export default function QuizComponent({
  tests,
  onComplete,
  successThreshold = 0.7,
}: QuizComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const currentTest = tests[currentIndex];

  const handleAnswerSelect = (index: number) => {
    if (!isSubmitted) setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setIsSubmitted(true);

    const isCorrect = selectedAnswer === currentTest.correctAnswerIndex;
    setResults((prev) => [...prev, isCorrect]);

    // If last question, show summary after short delay
    if (currentIndex === tests.length - 1) {
      setTimeout(() => {
        setShowSummary(true);
        onComplete();
      }, 1000);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const isSelectionCorrect = isSubmitted && selectedAnswer === currentTest.correctAnswerIndex;

  if (showSummary) {
    const correctCount = results.filter(Boolean).length;
    const total = tests.length;
    const rate = total > 0 ? correctCount / total : 0;

    let summaryText = "";
    let summaryColorClass = "";
    let emoji = "";

    if (rate >= successThreshold) {
      summaryText = "Gratulacje! Wspaniale Ci poszło!";
      summaryColorClass = "bg-emerald-500";
      emoji = "🎉";
    } else if (rate >= 0.5) {
      summaryText = "Nieźle! Jeszcze trochę praktyki i będzie perfekcyjnie!";
      summaryColorClass = "bg-amber-500";
      emoji = "💪";
    } else {
      summaryText = "Warto poćwiczyć! Następnym razem pójdzie lepiej!";
      summaryColorClass = "bg-slate-500";
      emoji = "📚";
    }

    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] rounded-lg shadow-sm text-white p-8 ${summaryColorClass}`}>
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-semibold mb-2 text-center">{summaryText}</h2>
        <div className="text-lg font-medium mt-4 bg-white/20 px-6 py-3 rounded-lg backdrop-blur-sm">
          Wynik: {correctCount}/{total} ({Math.round(rate * 100)}%)
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentIndex + 1) / tests.length) * 100;

  return (
    <div className="quiz-component max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Pytanie {currentIndex + 1} z {tests.length}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Quiz card */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        {/* Status indicator */}
        {isSubmitted && (
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${isSelectionCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {isSelectionCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-semibold">Poprawna odpowiedź!</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-semibold">Niepoprawna odpowiedź</span>
              </>
            )}
          </div>
        )}

        {/* Question */}
        <h3 className="text-xl font-semibold mb-6 leading-relaxed">{currentTest.question}</h3>

        {/* Answers */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          {currentTest.answers.map((answer, index) => {
            const isCorrect = index === currentTest.correctAnswerIndex;
            const isSelected = selectedAnswer === index;
            
            let buttonClass = "p-4 border-2 rounded-lg text-left font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-default";
            
            if (isSubmitted) {
              if (isCorrect) {
                buttonClass += " bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm";
              } else if (isSelected) {
                buttonClass += " bg-red-50 border-red-500 text-red-900";
              } else {
                buttonClass += " bg-muted/50 border-muted text-muted-foreground opacity-50";
              }
            } else {
              if (isSelected) {
                buttonClass += " bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]";
              } else {
                buttonClass += " bg-card border-border hover:border-primary/50 hover:bg-accent hover:shadow-sm active:scale-[0.98]";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isSubmitted}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <span>{answer}</span>
                  {isSubmitted && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 ml-2" />
                  )}
                  {isSubmitted && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 flex-shrink-0 ml-2" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isSubmitted && currentTest.correctAnswerDescription && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Wyjaśnienie: </span>
              {currentTest.correctAnswerDescription}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6">
          {isSubmitted && currentIndex < tests.length - 1 ? (
            <button
              onClick={handleNext}
              className="w-full py-3 px-4 rounded-lg text-primary-foreground font-semibold bg-primary hover:bg-primary/90 shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              Następne pytanie
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : !isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-sm
                ${
                  selectedAnswer === null
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
                }`}
            >
              Sprawdź odpowiedź
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}