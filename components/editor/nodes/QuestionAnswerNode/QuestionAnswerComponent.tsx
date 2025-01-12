import React, { useState } from "react";

export type QAType = {
  question: string;
  answer: string;
  explanation: string | null;
};

function QuestionAnswerComponent({ question, answer, explanation }: QAType) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleCheck = () => {
    const validationResult = userInput.trim() === answer.trim();
    setIsCorrect(validationResult);
  };

  return (
    <div className="mb-4">
      {/* Question */}
      <p className="text-gray-800 font-bold mb-2 text-xl">{question}</p>

      {/* Input with small "?" button */}
      <div className="relative inline-flex items-center space-x-1">
        <input
          type="text"
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            setIsCorrect(null); // Reset correctness when typing
          }}
          className={`w-full border rounded-md p-2 focus:outline-none pr-8 ${
            isCorrect === null
              ? "border-gray-300"
              : isCorrect
              ? "border-green-500"
              : "border-red-500"
          }`}
          placeholder="Your answer"
        />
        <button
          onClick={handleCheck}
          className="absolute right-2 bg-transparent text-gray-600 hover:text-blue-600 text-xs"
        >
          ❓
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
    </div>
  );
}
export default QuestionAnswerComponent;
