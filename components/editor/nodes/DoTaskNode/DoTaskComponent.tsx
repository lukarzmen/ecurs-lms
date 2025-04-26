import React, { useState, useEffect } from "react"; // Added useEffect
import ProgressSpinner from "../../plugins/TextGeneratorPlugin/ProgressComponent";
import { DoTaskType } from "../../plugins/TaskPlugin";

// Add props for initial state and callback
interface DoTaskComponentProps extends DoTaskType {
    initialCompleted: boolean;
    onComplete: (isCorrect: boolean) => void;
}

function DoTaskComponent({
    task,
    hint,
    initialCompleted, // Use initial state
    onComplete // Use callback
}: DoTaskComponentProps) { // Update props type
  const [userInput, setUserInput] = useState("");
  // Local state for immediate UI feedback (correctness based on last check)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(initialCompleted ? true : null);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to potentially reset local state if node state changes externally (optional)
  useEffect(() => {
      setIsCorrect(initialCompleted ? true : null);
      // Maybe clear userInput if initially completed? Depends on desired UX.
      // if (initialCompleted) setUserInput("");
  }, [initialCompleted]);

  const handleCheck = async () => { // Make async
    if (!userInput.trim()) {
      return;
    }
    setIsLoading(true);
    setIsCorrect(null); // Reset visual state before check

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: ``, // Consider if userPrompt is needed or should be based on userInput
          systemPrompt: `verify correctness of task based on instruction. be concise.
          ###
          instruction: ${task}
          ###
          user_answer: ${userInput.trim()}
          ###
          answer by exactly one word (no more) true or false.`,
        }),
      });

      if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
      }

      const text = await response.text();
      const isVerifiedCorrect = text.trim().toLowerCase() === 'true';

      setIsCorrect(isVerifiedCorrect); // Update local UI state
      onComplete(isVerifiedCorrect); // Update node's transient state via callback

    } catch (error) {
      console.error('Verification failed:', error);
      setIsCorrect(false); // Assume incorrect on error
      onComplete(false);   // Update node's transient state via callback
    } finally {
      setIsLoading(false);
    }
  };

  // Disable input and check button if the node is marked as completed
  const isDisabled = isCorrect === true; // Based on local state reflecting the last check result

  return (
    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow">
      {/* Pytanie/Instrukcja */}
      <p className="text-gray-800 font-bold mb-2 text-xl">{task}</p>

      {/* Pole tekstowe z ikonami wewnątrz */}
      <div className="relative">
        <textarea
          value={userInput}
          onChange={(e) => {
            if (isDisabled) return; // Prevent changes if already correct
            setUserInput(e.target.value);
            setIsCorrect(null); // Resetowanie poprawności podczas pisania
            // Optionally reset node state while typing if desired: onComplete(false);
          }}
          className={`w-full border rounded-md p-2 pr-16 focus:outline-none ${ // Increased padding-right
            isDisabled // Style based on disabled state
              ? "border-green-500 bg-gray-100 cursor-not-allowed"
              : isCorrect === null
                ? "border-gray-300"
                : "border-red-500" // Only red if attempted and incorrect
          }`}
          placeholder="Twoja odpowiedź"
          rows={3} // Example: Set a default number of rows
          disabled={isDisabled} // Disable textarea if correct
        />
        {!isDisabled && ( // Only show check button if not disabled
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                {isLoading ? (
                    <ProgressSpinner />
                ) : (
                    <button
                        onClick={handleCheck}
                        className="text-gray-600 hover:text-orange-600"
                        title="Sprawdź swoją odpowiedź"
                        disabled={!userInput.trim()} // Disable if input is empty
                    >
                        ❓
                    </button>
                )}
            </div>
        )}
      </div>

      {/* Informacja zwrotna o poprawności (only show if attempted) */}
      {isCorrect !== null && (
        <p
          className={`mt-2 text-sm font-medium ${
            isCorrect ? "text-green-600" : "text-red-600"
          }`}
        >
          {isCorrect ? "Super!" : "Niestety musisz spróbować jeszcze raz!"}
        </p>
      )}

      {/* Optionally show hint if available and needed */}
      {/* {hint && <p className="mt-2 text-sm text-gray-500">Wskazówka: {hint}</p>} */}
    </div>
  );
}

export default DoTaskComponent;
