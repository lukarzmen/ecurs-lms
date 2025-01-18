import React, { useState } from "react";

export type QAType = {
  question: string;
  answer: string;
  explanation: string | null;
};

function QuestionAnswerComponent({ question, answer, explanation }: QAType) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleCheck = () => {
    const validationResult = userInput.trim() === answer.trim();
    setIsCorrect(validationResult);
  };

  return (
    <div className="mb-4">
      {/* Question */}
      <p className="text-gray-800 font-bold mb-2 text-xl">{question}</p>

      {/* Input with icons inside */}
      <div className="relative">
        <input
          type="text"
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            setIsCorrect(null); // Reset correctness when typing
            setShowAnswer(false); // Hide answer when typing
          }}
          className={`w-full border rounded-md p-2 pr-16 focus:outline-none ${
            isCorrect === null
              ? "border-gray-300"
              : isCorrect
              ? "border-green-500"
              : "border-red-500"
          }`}
          placeholder="Your answer"
        />
        {/* Check Button */}
        <button
          onClick={handleCheck}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-600"
          title="Check your answer"
        >
          ❓
        </button>
        {/* Show/Hide Answer Button */}
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-600"
          title={showAnswer ? "Hide Answer" : "Show Answer"}
        >
          {showAnswer ? "🙈" : "👁️"}
        </button>
      </div>

      {/* Correctness Feedback */}
      {isCorrect !== null && (
        <p
          className={`mt-2 text-sm font-medium ${
            isCorrect ? "text-green-600" : "text-red-600"
          }`}
        >
          {isCorrect ? "Correct!" : "Incorrect, try again!"}
        </p>
      )}

      {/* Display Answer and Explanation */}
      {(showAnswer || isCorrect) && (
        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <strong>Answer:</strong> {answer}
          </p>
          {explanation && (
            <p className="text-sm text-gray-700 mt-1">
              <strong>Explanation:</strong> {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionAnswerComponent;
