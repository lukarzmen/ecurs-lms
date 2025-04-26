import React, { useState, useEffect } from "react";
import ProgressSpinner from "../../plugins/TextGeneratorPlugin/ProgressComponent";

export type QAType = {
  question: string;
  answer: string;
  explanation: string | null;
};

// Add props for initial state and callback
interface QuestionAnswerComponentProps extends QAType {
    initialCompleted: boolean;
    onComplete: (isCorrect: boolean) => void;
}

function QuestionAnswerComponent({
    question,
    answer,
    explanation,
    initialCompleted, // Use initial state
    onComplete // Use callback
}: QuestionAnswerComponentProps) {
  const [userInput, setUserInput] = useState("");
  // Local state for immediate UI feedback (correctness based on last check)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(initialCompleted ? true : null);
  const [showAnswer, setShowAnswer] = useState(initialCompleted); // Show answer if initially completed
  const [isLoading, setIsLoading] = useState(false);

  // Effect to potentially reset local state if node state changes externally (optional)
  useEffect(() => {
      setIsCorrect(initialCompleted ? true : null);
      setShowAnswer(initialCompleted);
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
          userPrompt: ``,
          systemPrompt: `verify correctness of answer based on question and explaination as context. be concise.
          ###
          question: ${question}
          ###
          answer: ${userInput.trim()}
          ###
          explaination: ${explanation}
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
      if (isVerifiedCorrect) {
          setShowAnswer(true); // Show answer if correct
      }

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
      {/* Pytanie */}
      <p className="text-gray-800 font-bold mb-2 text-xl">{question}</p>

      {/* Pole tekstowe z ikonami wewnątrz */}
      <div className="relative">
        <input
          type="text"
          value={userInput}
          onChange={(e) => {
            if (isDisabled) return; // Prevent changes if already correct
            setUserInput(e.target.value);
            setIsCorrect(null); // Resetowanie poprawności podczas pisania
            setShowAnswer(false); // Ukrywanie odpowiedzi podczas pisania
          }}
          className={`w-full border rounded-md p-2 pr-16 focus:outline-none ${
            isDisabled // Style based on disabled state
              ? "border-green-500 bg-gray-100 cursor-not-allowed"
              : isCorrect === null
                ? "border-gray-300"
                : "border-red-500" // Only red if attempted and incorrect
          }`}
          placeholder="Twoja odpowiedź"
          disabled={isDisabled} // Disable input if correct
        />
        {!isDisabled && ( // Only show check button if not disabled
            isLoading ? (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                    <ProgressSpinner />
                </div>
             ) : (
                <button
                    onClick={handleCheck}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-orange-600"
                    title="Sprawdź swoją odpowiedź"
                    disabled={!userInput.trim()} // Disable if input is empty
                >
                    ❓
                </button>
            )
        )}

        {/* Przycisk Pokaż/Ukryj odpowiedź */}
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-orange-600"
          title={showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
        >
          {showAnswer ? "🙈" : "👁️"}
        </button>
      </div>

      {/* Informacja zwrotna o poprawności (only show if attempted and not correct, or if correct) */}
      {isCorrect !== null && (
        <p
          className={`mt-2 text-sm font-medium ${
            isCorrect ? "text-green-600" : "text-red-600"
          }`}
        >
          {isCorrect ? "Super!" : "Niestety musisz spróbować jeszcze raz!"}
        </p>
      )}

      {/* Wyświetlanie odpowiedzi i wyjaśnienia */}
      {showAnswer && ( // Always show if showAnswer is true
        <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
          <p className="text-sm text-orange-700">
            <strong>Poprawna odpowiedź:</strong> {answer}
          </p>
          {explanation && (
            <p className="text-sm text-gray-700 mt-1">
              <strong>Wyjaśnienie / Wskazówka:</strong> {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionAnswerComponent;
