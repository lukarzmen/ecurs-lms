import React, { useState } from "react";
import { NodeKey } from "lexical";

export type SelectAnswerComponentProps = {
  answers: string[];
  correctAnswerIndex: number;
  selectedAnswer: string | null; // Receive selected answer state
  isCompleted: boolean;         // Receive completion state
  nodeKey: NodeKey;
  onSelect: (answer: string | null) => void; // Callback to update node state
  onCheck: () => void;                     // Callback to update node state
};

export function SelectAnswerComponent({
  answers,
  correctAnswerIndex,
  selectedAnswer, // Use prop
  isCompleted,    // Use prop
  nodeKey,
  onSelect,       // Use callback
  onCheck,        // Use callback
}: SelectAnswerComponentProps) {
  // Local UI state (not core logic state)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tempBorder, setTempBorder] = useState(false); // For temporary incorrect feedback

  // Determine correctness based on props for rendering feedback
  // Note: isCorrectSelection is used for immediate feedback logic within this component
  const isAttempted = selectedAnswer !== null;
  const isCorrectSelection = isAttempted && answers[correctAnswerIndex] === selectedAnswer;

  const handleSelect = (answer: string) => {
    // 1. Update the node's selected answer state
    onSelect(answer);

    // 2. Immediately trigger the check logic in the node
    // We need to ensure the node state update from onSelect happens *before* onCheck reads it.
    // Lexical updates are batched, so we might need a slight delay or rely on the next render cycle.
    // A simple approach is to call onCheck directly, assuming the state update is processed quickly enough.
    // For more robustness, one might pass the selected answer to onCheck, but let's try the direct call first.
    onCheck(); // This will call node.checkAnswer()

    // 3. Close the dropdown
    setDropdownOpen(false);

    // 4. Handle temporary visual feedback *after* the check has likely run
    // We check if the selected answer *is not* the correct one
    if (answer !== answers[correctAnswerIndex]) {
        setTempBorder(true);
        setTimeout(() => setTempBorder(false), 1000);
    } else {
        // Ensure temp border is cleared if the correct answer is selected
        setTempBorder(false);
    }
  };

  // handleCheck function is no longer needed as a separate action
  // const handleCheck = () => { ... };

  const toggleDropdown = () => {
    // Allow opening dropdown even if completed, to potentially re-select (depends on desired UX)
    // If you want to lock it after completion, use: if (isCompleted) return;
    setDropdownOpen((prev) => !prev);
  };

  // Determine border style based on node state (isCompleted) and local UI state (tempBorder)
  // isCompleted reflects the node's state *after* onCheck has run
  const borderStyle = tempBorder
    ? "border-red-500" // Temporary incorrect flash
    : !isAttempted && !isCompleted // Not yet attempted and node isn't completed
      ? "border-gray-300"
      : isCompleted // Node state says it's completed (correct)
        ? "border-green-500"
        : "border-red-500"; // Attempted but node state says not completed (incorrect)

  // Disable interaction if the node is marked as completed
  const isDisabled = isCompleted;

  return (
    <div className="inline-flex flex-col items-start space-y-2 pr-4">
      <div className="relative w-full">
        <div
          className={`border px-2 py-1 text-sm rounded-md focus:outline-none ${borderStyle} ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
          // Allow clicking to open dropdown even if disabled, but handleSelect won't run if options are clicked while disabled
          onClick={toggleDropdown}
        >
          {selectedAnswer || "Wybierz odpowiedź"}
        </div>
        {dropdownOpen && ( // Removed !isDisabled check here to allow dropdown to show, but options handle selection logic
          <div className="absolute w-full bg-white border border-gray-300 rounded-md mt-1 z-10">
            {answers.map((answer, index) => (
              <div
                key={index}
                onClick={() => {
                    if (isDisabled) return; // Prevent selection if already completed
                    handleSelect(answer);
                }}
                className={`px-2 py-1 text-sm hover:bg-gray-100 ${isDisabled ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer'}`}
              >
                {answer}
              </div>
            ))}
          </div>
        )}
        {/* Removed the separate check button */}
        {/* {!isDisabled && ( ... button ... )} */}
      </div>
      {/* Show feedback message based on node's completion state after an attempt */}
      {isAttempted && (
        <span className={`text-sm ${isCompleted ? "text-green-600" : "text-red-600"}`}>
          {isCompleted ? "Poprawna odpowiedź! 🎉" : "Niepoprawna odpowiedź."} {/* Simplified incorrect message */}
        </span>
      )}
    </div>
  );
}
