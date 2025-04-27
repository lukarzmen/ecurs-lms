import React, { useState, useEffect } from "react";
import { NodeKey } from "lexical";

export type SelectAnswerComponentProps = {
  answers: string[];
  correctAnswerIndex: number;
  initialSelectedAnswer: string | null; // Renamed for clarity
  isNodeCompleted: boolean; // Renamed: reflects the node's persistent state
  nodeKey: NodeKey;
  onSelect: (answer: string | null) => void; // Callback to update node's selected answer
  onComplete: (isCorrect: boolean) => void; // Callback to update node's completion status
};

export function SelectAnswerComponent({
  answers,
  correctAnswerIndex,
  initialSelectedAnswer,
  isNodeCompleted, // Use renamed prop
  nodeKey,
  onSelect,
  onComplete, // Use new callback
}: SelectAnswerComponentProps) {
  // --- Local UI State ---
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(initialSelectedAnswer);
  const [isAttempted, setIsAttempted] = useState<boolean>(initialSelectedAnswer !== null);
  // Local completion state for immediate UI feedback
  const [isLocallyCompleted, setIsLocallyCompleted] = useState<boolean>(
    initialSelectedAnswer !== null && initialSelectedAnswer === answers[correctAnswerIndex]
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // --- End Local UI State ---

  // Effect to sync local state if the initial prop changes (e.g., undo/redo)
  useEffect(() => {
    setSelectedAnswer(initialSelectedAnswer);
    const attempted = initialSelectedAnswer !== null;
    setIsAttempted(attempted);
    setIsLocallyCompleted(attempted && initialSelectedAnswer === answers[correctAnswerIndex]);
  }, [initialSelectedAnswer, answers, correctAnswerIndex]);


  const handleSelect = (answer: string) => {
    // 1. Update local state immediately for UI responsiveness
    setSelectedAnswer(answer);
    setIsAttempted(true);
    const isCorrect = answer === answers[correctAnswerIndex];
    setIsLocallyCompleted(isCorrect);

    // 2. Update the node's selected answer state via callback
    onSelect(answer);

    // 3. Inform the node about the completion status via callback
    onComplete(isCorrect);

    // 4. Close the dropdown
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    // Prevent opening dropdown if the NODE is marked as completed
    if (isNodeCompleted) return;
    setDropdownOpen((prev) => !prev);
  };

  // Determine border style based on local UI state
  const borderStyle = !isAttempted
    ? "border-gray-300" // Not yet attempted
    : isLocallyCompleted
      ? "border-green-500" // Locally correct
      : "border-red-500";   // Locally incorrect

  // Disable interaction if the NODE is marked as completed (persistent state)
  const isDisabled = isNodeCompleted;

  return (
    <div className="inline-flex flex-col items-start space-y-2 pr-4">
      <div className="relative w-full">
        <div
          className={`border px-2 py-1 text-sm rounded-md focus:outline-none ${borderStyle} ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'cursor-pointer'}`} // Added text-gray-400 for disabled
          onClick={toggleDropdown}
        >
          {selectedAnswer || "Wybierz odpowiedź"}
        </div>
        {dropdownOpen && (
          <div className="absolute w-full bg-white border border-gray-300 rounded-md mt-1 z-10">
            {answers.map((answer, index) => (
              <div
                key={index}
                onClick={() => {
                    // handleSelect already handles logic, just call it
                    handleSelect(answer);
                }}
                // Apply disabled styles to options if interaction is disabled (redundant as dropdown won't open, but safe)
                className={`px-2 py-1 text-sm hover:bg-gray-100 ${isDisabled ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer'}`}
              >
                {answer}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Show feedback message based on LOCAL completion state *after* an attempt */}
      {isAttempted && (
        <span className={`text-sm ${isLocallyCompleted ? "text-green-600" : "text-red-600"}`}>
          {isLocallyCompleted ? "Poprawna odpowiedź! 🎉" : "Niepoprawna odpowiedź."}
        </span>
      )}
    </div>
  );
}
