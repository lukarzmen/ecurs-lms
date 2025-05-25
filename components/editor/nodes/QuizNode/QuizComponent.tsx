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
}

export default function QuizComponent({
  tests,
  onComplete,
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-green-600 rounded-lg text-white p-8">
        <h2 className="text-2xl font-bold mb-4">Gratulacje. Ukończyłeś quiz.</h2>
        <div className="text-lg font-semibold">
          Poprawne odpowiedzi {correctCount}/{tests.length}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-component p-4 max-w-md mx-auto border border-gray-300 rounded-lg shadow-md bg-white/80 backdrop-blur-sm relative">
      <h3 className="text-lg font-bold mb-4 text-center">
        {currentTest.question}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {currentTest.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={isSubmitted}
            className={`p-2 border rounded-lg text-center transition-all duration-200 hover:shadow-md ${
              isSubmitted
                ? index === currentTest.correctAnswerIndex
                  ? 'bg-green-500 text-white'
                  : selectedAnswer === index
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200'
                : selectedAnswer === index
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-orange-300 text-white hover:bg-orange-600'
            }`}
          >
            {answer}
          </button>
        ))}
      </div>
      {isSubmitted ? (
        <div>
          <p className="mt-4 text-center font-medium text-lg">
            {isSelectionCorrect ? 'Poprawna odpowiedź!' : 'Niepoprawna odpowiedź.'}
          </p>
          {isSelectionCorrect && currentTest.correctAnswerDescription ? (
            <p className="mt-4 text-center font-medium italic">
              {currentTest.correctAnswerDescription}
            </p>
          ) : null}
          {currentIndex < tests.length - 1 && (
            <button
              onClick={handleNext}
              className="mt-4 w-full py-2 px-4 rounded-lg text-white font-bold bg-blue-500 hover:bg-blue-600"
            >
              Następne pytanie
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-white font-bold transition-all duration-200 ${
            selectedAnswer === null
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          Sprawdź
        </button>
      )}
    </div>
  );
}