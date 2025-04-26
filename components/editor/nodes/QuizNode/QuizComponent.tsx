import React, { useState } from 'react';
import { NodeKey } from 'lexical'; // Import NodeKey if needed, though not directly used here for update

interface QuizComponentProps {
  question: string;
  answers: string[];
  correctAnswerIndex: number;
  nodeKey: NodeKey; // Keep nodeKey if needed for other purposes, but update uses callback
  correctAnswerDescription: string | null;
  onComplete: (isCorrect: boolean) => void; // Callback to update node
}

export default function QuizComponent({
    question,
    answers,
    correctAnswerIndex,
    nodeKey,
    correctAnswerDescription,
    onComplete // Use callback
}: QuizComponentProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  // Initialize submitted state to false, as completion state is transient
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnswerSelect = (index: number) => {
    if (!isSubmitted) setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return; // Should not happen if button is disabled

    const isCorrect = selectedAnswer === correctAnswerIndex;
    setIsSubmitted(true); // Update local UI state

    // Call the callback to update the node's __isCompleted state
    onComplete(isCorrect);
  };

  // Determine if the currently selected answer (after submission) is correct
  const isSelectionCorrect = isSubmitted && selectedAnswer === correctAnswerIndex;

  return (
    <div className="quiz-component p-4 max-w-md mx-auto border border-gray-300 rounded-lg shadow-md bg-white/80 backdrop-blur-sm">
      <h3 className="text-lg font-bold mb-4 text-center">{question}</h3>
      <div className="grid grid-cols-2 gap-4">
      {answers.map((answer, index) => (
        <button
        key={index}
        onClick={() => handleAnswerSelect(index)}
        disabled={isSubmitted} // Disable buttons after submission
        className={`p-2 border rounded-lg text-center transition-all duration-200 hover:shadow-md ${
          isSubmitted // Styles after submission
          ? index === correctAnswerIndex // Correct answer style
            ? 'bg-green-500 text-white'
            : selectedAnswer === index // Incorrectly selected answer style
            ? 'bg-red-500 text-white'
            : 'bg-gray-200' // Other answers style
          : selectedAnswer === index // Style for selected answer before submission
          ? 'bg-purple-500 text-white hover:bg-purple-600'
          : 'bg-orange-300 text-white hover:bg-orange-600' // Style for unselected answers before submission
        }`}
        >
        {answer}
        </button>
      ))}
      </div>
      {isSubmitted ? ( // Show results after submission
      <div>
      <p className="mt-4 text-center font-medium text-lg">
        {isSelectionCorrect ? 'Poprawna odpowiedź!' : 'Niepoprawna odpowiedź.'}
      </p>
      {/* Show description only if the answer was correct */}
      {isSelectionCorrect && correctAnswerDescription ? <p className="mt-4 text-center font-medium italic">{correctAnswerDescription}</p> : null}
      </div>

      ) : ( // Show submit button before submission
      <button
        onClick={handleSubmit}
        disabled={selectedAnswer === null} // Disable if no answer selected
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