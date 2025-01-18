import React, { useState } from 'react';

interface QuizComponentProps {
  question: string;
  answers: string[];
  correctAnswerIndex: number;
  nodeKey: string;
  correctAnswerDescription: string | null;
}

export default function QuizComponent({ question, answers, correctAnswerIndex, nodeKey, correctAnswerDescription }: QuizComponentProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnswerSelect = (index: number) => {
    if (!isSubmitted) setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="quiz-component p-4 max-w-md mx-auto border border-gray-300 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4 text-center">{question}</h3>
      <div className="grid grid-cols-2 gap-4">
        {answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={isSubmitted}
            className={`p-2 border rounded-lg text-center transition-all duration-200 hover:shadow-md ${
              isSubmitted
                ? index === correctAnswerIndex
                  ? 'bg-green-500 text-white'
                  : selectedAnswer === index
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {answer}         
          </button>
        ))}
      </div>
      {isSubmitted ? (
        <div>
        <p className="mt-4 text-center font-medium text-lg">
          {selectedAnswer === correctAnswerIndex ? 'Correct!' : 'Incorrect. Try again!'}
        </p>
        {correctAnswerDescription ? <p className="mt-4 text-center font-medium italic">{correctAnswerDescription}</p> : null}
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
          Submit
        </button>
      )}
    </div>
  );
}