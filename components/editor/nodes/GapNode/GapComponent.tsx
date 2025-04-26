import React, { useState, useEffect } from "react";

export type GapComponentProps = {
  hiddenText: string;
  initialCompleted: boolean; // Receive initial state
  onComplete: (isCorrect: boolean) => void; // Callback to update node
};

export function GapComponent({
    hiddenText,
    initialCompleted, // Use initial state
    onComplete // Use callback
}: GapComponentProps) {
  const [userInput, setUserInput] = useState("");
  // Local state for immediate UI feedback (correctness based on last check)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(initialCompleted ? true : null);

  // Effect to potentially reset local state if node state changes externally (optional)
  useEffect(() => {
      setIsCorrect(initialCompleted ? true : null);
      // Maybe clear userInput if initially completed? Depends on desired UX.
      // if (initialCompleted) setUserInput("");
  }, [initialCompleted]);

  const checkAnswer = () => {
    const correct = userInput.trim().toLowerCase() === hiddenText.toLowerCase();
    setIsCorrect(correct); // Update local UI state
    onComplete(correct); // Update node's transient state via callback
  };

  const showHint = () => {
    // Showing hint marks it as correct in this implementation
    setUserInput(hiddenText);
    setIsCorrect(true);
    onComplete(true); // Update node state when hint is shown
  };

  // Disable input and buttons if the node is marked as completed (via isCorrect reflecting node state)
  const isDisabled = isCorrect === true;

  return (
    <span className="inline-flex items-center space-x-1">
      <div className="relative inline-flex items-center">
        <input
          type="text"
          value={userInput}
          onChange={(e) => {
            if (isDisabled) return; // Prevent changes if already correct
            setUserInput(e.target.value);
            setIsCorrect(null); // Reset local correctness state while typing
            // Optionally reset node state while typing if desired: onComplete(false);
          }}
          className={`border px-2 py-1 text-sm rounded-md pr-16 focus:outline-none ${ // Increased padding-right
            isDisabled // Style based on disabled state
              ? "border-green-500 bg-gray-100 cursor-not-allowed"
              : isCorrect === null
                ? "border-gray-300"
                : "border-red-500" // Only red if attempted and incorrect
          }`}
          style={{ width: "200px" }}
          placeholder="Wpisz odpowiedź"
          disabled={isDisabled} // Disable input if correct
        />
        {!isDisabled && ( // Only show buttons if not disabled
            <>
                <button
                    onClick={showHint}
                    className="absolute right-8 bg-transparent text-gray-600 hover:text-orange-600 text-xs"
                    title="Pokaż podpowiedź"
                >
                    👁️
                </button>
                <button
                    onClick={checkAnswer}
                    className="absolute right-1 bg-transparent text-gray-600 hover:text-green-600 text-xs"
                    title="Sprawdź odpowiedź"
                    disabled={!userInput.trim()} // Disable check if input is empty
                >
                    ❓
                </button>
            </>
        )}
      </div>
    </span>
  );
}
