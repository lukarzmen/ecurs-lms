import React, { useState } from "react";

export type SelectAnswerComponentProps = {
  answers: string[];
  correctAnswerIndex: number;
};

export function SelectAnswerComponent({ answers, correctAnswerIndex }: SelectAnswerComponentProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [tempBorder, setTempBorder] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    const correct = answers[correctAnswerIndex] === selectedAnswer;
    setIsCorrect(correct);
    if (!correct) {
      setTempBorder(true);
      setTimeout(() => setTempBorder(false), 1000);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setIsCorrect(null);
    setDropdownOpen(false);
  };

  return (
    <div className="inline-flex flex-col items-start space-y-2 pr-4"> {/* Added padding here */}
      <div className="relative w-full">
        <div
          className={`border px-2 py-1 text-sm rounded-md cursor-pointer focus:outline-none ${tempBorder
            ? "border-red-500"
            : isCorrect === null
              ? "border-gray-300"
              : isCorrect
                ? "border-green-500"
                : "border-red-500"
            }`}
          onClick={toggleDropdown}
        >
          {selectedAnswer || "Wybierz odpowiedź"}
        </div>
        {dropdownOpen && (
          <div className="absolute w-full bg-white border border-gray-300 rounded-md mt-1 z-10">
            {answers.map((answer, index) => (
              <div
                key={index}
                onClick={() => handleSelect(answer)}
                className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer"
              >
                {answer}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={checkAnswer}
          className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 bg-transparent text-gray-600 hover:text-green-600 text-xs ml-2"
        >
          ❓
        </button>
      </div>
      {isCorrect !== null && (
        <span className={`text-sm ${isCorrect ? "text-green-600" : "text-red-600"}`}>
          {isCorrect ? "Correct! 🎉" : "Incorrect. Try again! ❌"}
        </span>
      )}
    </div>
  );
}
