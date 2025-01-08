import React, { useState } from 'react';

interface QuizComponentProps {
  question: string;
  answers: string[];
  correctAnswerIndex: number;
  nodeKey: string;
}

export default function QuizComponent({ question, answers, correctAnswerIndex, nodeKey }: QuizComponentProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnswerSelect = (index: number) => {
    if (!isSubmitted) setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="quiz-component">
      <h3>{question}</h3>
      <ul>
        {answers.map((answer, index) => (
          <li key={index}>
            <button
              onClick={() => handleAnswerSelect(index)}
              disabled={isSubmitted}
              style={{
                backgroundColor: isSubmitted
                  ? index === correctAnswerIndex
                    ? 'green'
                    : selectedAnswer === index
                    ? 'red'
                    : ''
                  : '',
              }}
            >
              {answer}
            </button>
          </li>
        ))}
      </ul>
      {isSubmitted ? (
        <p>
          {selectedAnswer === correctAnswerIndex ? 'Correct!' : 'Incorrect. Try again!'}
        </p>
      ) : (
        <button onClick={handleSubmit} disabled={selectedAnswer === null}>
          Submit
        </button>
      )}
    </div>
  );
}
