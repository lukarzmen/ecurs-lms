import React, { useState } from 'react';

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
      }, 800);
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
    let summaryColor = "";

    if (rate >= successThreshold) {
      summaryText = "Wow! Jesteś geniuszem! Może powinieneś uczyć innych? 🎓";
      summaryColor = "bg-orange-700";
    } else if (rate >= 0.5) {
      summaryText = "No prawie, prawie... Jak mawiają - prawie robi wielką różnicę! 😅";
      summaryColor = "bg-orange-400";
    } else {
      summaryText = "Warto jeszcze poćwiczyć! Następnym razem na pewno pójdzie lepiej! 💪";
      summaryColor = "bg-orange-200 text-orange-900";
    }

    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] rounded-2xl shadow-xl text-white p-8 ${summaryColor}`}>
        <h2 className="text-2xl font-bold mb-4 drop-shadow">{summaryText}</h2>
        <div className="text-lg font-semibold drop-shadow">
          Poprawne odpowiedzi {correctCount}/{total}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-component p-6 max-w-xl mx-auto border border-orange-200 rounded-2xl shadow-xl bg-orange-50/80 backdrop-blur-sm relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-orange-700 font-semibold">
          Pytanie {currentIndex + 1} z {tests.length}
        </span>
        {isSubmitted && (
          <span className={`text-xs font-bold ${isSelectionCorrect ? "text-green-600" : "text-red-500"}`}>
            {isSelectionCorrect ? "Poprawna odpowiedź" : "Niepoprawna odpowiedź"}
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold mb-6 text-center text-orange-900">{currentTest.question}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
        {currentTest.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={isSubmitted}
            className={`p-3 border-2 rounded-xl text-center font-medium transition-all duration-200 shadow-sm focus:outline-none
              ${
                isSubmitted
                  ? index === currentTest.correctAnswerIndex
                    ? 'bg-orange-500 border-orange-700 text-white animate-pulse'
                    : selectedAnswer === index
                    ? 'bg-red-400 border-red-600 text-white'
                    : 'bg-orange-100 border-orange-200 text-orange-400'
                  : selectedAnswer === index
                  ? 'bg-orange-400 border-orange-600 text-white ring-2 ring-orange-300'
                  : 'bg-white border-orange-200 text-orange-900 hover:bg-orange-100 hover:border-orange-400'
              }`}
          >
            {answer}
          </button>
        ))}
      </div>
      {isSubmitted && (
        <div className="mt-4 text-center">
          {!isSelectionCorrect && (
            <p className="font-semibold text-red-600 mb-2">Spróbuj jeszcze raz!</p>
          )}
          {currentTest.correctAnswerDescription && (
            <p className="mt-2 text-orange-800 italic">{currentTest.correctAnswerDescription}</p>
          )}
          {currentIndex < tests.length - 1 && (
            <button
              onClick={handleNext}
              className="mt-6 w-full py-2 px-4 rounded-xl text-white font-bold bg-orange-600 hover:bg-orange-700 shadow transition-all duration-200"
            >
              Następne pytanie
            </button>
          )}
        </div>
      )}
      {!isSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className={`mt-6 w-full py-2 px-4 rounded-xl font-bold transition-all duration-200 shadow
            ${
              selectedAnswer === null
                ? 'bg-orange-200 text-orange-400 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
        >
          Sprawdź
        </button>
      )}
    </div>
  );
}