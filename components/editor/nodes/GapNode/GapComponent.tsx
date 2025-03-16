import React, { useState } from "react";

export type GapComponentProps = {
  hiddenText: string;
};

export function GapComponent({ hiddenText }: GapComponentProps) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const checkAnswer = () => {
    setIsCorrect(userInput.trim().toLowerCase() === hiddenText.toLowerCase());
  };

  return (
    <span className="inline-flex items-center space-x-1">
      <div className="relative inline-flex items-center">
        <input
          type="text"
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            setIsCorrect(null);
            }}
            className={`border px-2 py-1 text-sm rounded-md pr-6 focus:outline-none ${
            isCorrect === null
              ? "border-gray-300"
              : isCorrect
              ? "border-green-500"
              : "border-red-500"
            }`}
            style={{ width: "200px" }}
            placeholder="Wpisz odpowiedź"
          />
        <button
          onClick={() => {
            setUserInput(hiddenText);
            setIsCorrect(true);
          }}
          className="absolute right-8 bg-transparent text-gray-600 hover:text-blue-600 text-xs"
        >
          👁️
        </button>
        <button
          onClick={checkAnswer}
          className="absolute right-1 bg-transparent text-gray-600 hover:text-green-600 text-xs"
        >
          ❓
        </button>
      </div>
    </span>
  );
}
