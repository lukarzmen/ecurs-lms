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
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null); // State for LLM explanation

  // Effect to potentially reset local state if node state changes externally (optional)
  useEffect(() => {
      setIsCorrect(initialCompleted ? true : null);
      setLlmExplanation(null); // Reset LLM explanation
      // Maybe clear userInput if initially completed? Depends on desired UX.
      // if (initialCompleted) setUserInput("");
  }, [initialCompleted]);

  const handleCheck = async () => { // Make async
    if (!userInput.trim()) {
      return;
    }
    setIsLoading(true);
    setIsCorrect(null); // Reset visual state before check
    setLlmExplanation(null); // Reset LLM explanation before new check

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: ``, 
          systemPrompt: `Zweryfikuj poprawność odpowiedzi użytkownika na podstawie instrukcji. Bądź zwięzły.
Odpowiedz "true", jeśli odpowiedź jest poprawna.
Odpowiedz "false: [twoje wyjaśnienie]", jeśli odpowiedź jest niepoprawna, podając krótkie wyjaśnienie, dlaczego.
Na przykład: "false: Stolicą Francji jest Paryż, a nie Berlin."
###
instrukcja: ${task}
###
odpowiedź_użytkownika: ${userInput.trim()}
###`,
        }),
      });

      if (!response.ok) {
          throw new Error(`Błąd API: ${response.statusText}`);
      }

      const text = await response.text();
      const textLower = text.trim().toLowerCase();
      let isVerifiedCorrect = false;
      let explanationFromLlm = null;

      if (textLower.startsWith('true')) {
        isVerifiedCorrect = true;
      } else if (textLower.startsWith('false')) {
        isVerifiedCorrect = false;
        // Extract explanation after "false: "
        const colonIndex = text.indexOf(':');
        if (colonIndex > -1) {
          explanationFromLlm = text.substring(colonIndex + 1).trim();
        } else {
          // Fallback if "false" but no colon
           explanationFromLlm = "Odpowiedź jest niepoprawna, ale nie udało się uzyskać szczegółowego wyjaśnienia.";
        }
      } else {
        // Fallback if the response format is unexpected
        console.warn("Nieoczekiwany format odpowiedzi LLM:", text);
        isVerifiedCorrect = false; // Assume incorrect if format is wrong
        explanationFromLlm = "Nie udało się zweryfikować odpowiedzi. Spróbuj ponownie.";
      }
      
      setLlmExplanation(explanationFromLlm);
      setIsCorrect(isVerifiedCorrect); // Update local UI state
      onComplete(isVerifiedCorrect); // Update node's transient state via callback

    } catch (error) {
      console.error('Weryfikacja nie powiodła się:', error);
      setIsCorrect(false); // Assume incorrect on error
      setLlmExplanation("Wystąpił błąd podczas weryfikacji odpowiedzi.");
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
            setLlmExplanation(null); // Resetuj wyjaśnienie LLM podczas pisania
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
          {isCorrect ? "Super!" : "Niestety, spróbuj jeszcze raz!"}
        </p>
      )}

      {/* Wyświetlanie wyjaśnienia od LLM, jeśli odpowiedź jest niepoprawna */}
      {isCorrect === false && llmExplanation && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            <strong className="font-semibold">Wskazówka od AI:</strong> {llmExplanation}
          </p>
        </div>
      )}

      {/* Optionally show hint if available and needed */}
      {/* {hint && <p className="mt-2 text-sm text-gray-500">Wskazówka: {hint}</p>} */}
    </div>
  );
}

export default DoTaskComponent;
