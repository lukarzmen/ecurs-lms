import React, { useState, useEffect } from "react";
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
    initialCompleted,
    onComplete
}: DoTaskComponentProps) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(initialCompleted ? true : null);
  const [isLoading, setIsLoading] = useState(false);
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);

  useEffect(() => {
      setIsCorrect(initialCompleted ? true : null);
      setLlmExplanation(null);
  }, [initialCompleted]);

  const handleCheck = async () => {
    if (!userInput.trim()) {
      return;
    }
    setIsLoading(true);
    setIsCorrect(null);
    setLlmExplanation(null);

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
        const colonIndex = text.indexOf(':');
        if (colonIndex > -1) {
          explanationFromLlm = text.substring(colonIndex + 1).trim();
        } else {
           explanationFromLlm = "Odpowiedź jest niepoprawna, ale nie udało się uzyskać szczegółowego wyjaśnienia.";
        }
      } else {
        console.warn("Nieoczekiwany format odpowiedzi LLM:", text);
        isVerifiedCorrect = false;
        explanationFromLlm = "Nie udało się zweryfikować odpowiedzi. Spróbuj ponownie.";
      }
      
      setLlmExplanation(explanationFromLlm);
      setIsCorrect(isVerifiedCorrect);
      onComplete(isVerifiedCorrect);

    } catch (error) {
      console.error('Weryfikacja nie powiodła się:', error);
      setIsCorrect(false);
      setLlmExplanation("Wystąpił błąd podczas weryfikacji odpowiedzi.");
      onComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isCorrect === true;

  return (
    <div className="mb-6 p-6 border border-gray-200 rounded-2xl bg-white/90 backdrop-blur shadow-lg transition-shadow hover:shadow-xl">
      {/* Treść zadania */}
      <label className="block text-gray-700 font-semibold mb-1 text-base" htmlFor="dotask-task">
        Treść zadania:
      </label>
      <p id="dotask-task" className="text-gray-900 font-bold mb-4 text-xl leading-tight">
        {task}
      </p>

      {/* Twoja odpowiedź */}
      <label className="block text-gray-700 font-semibold mb-1 text-base" htmlFor="dotask-answer">
        Twoja odpowiedź:
      </label>
      <div className="relative">
        <textarea
          id="dotask-answer"
          value={userInput}
          onChange={(e) => {
            if (isDisabled) return;
            setUserInput(e.target.value);
            setIsCorrect(null);
            setLlmExplanation(null);
          }}
          className={`w-full border rounded-lg p-3 pr-24 text-lg focus:outline-none focus:ring-2 transition-all duration-150
            ${isDisabled
              ? "border-green-400 bg-gray-100 cursor-not-allowed text-gray-500"
              : isCorrect === null
                ? "border-gray-300 focus:border-orange-400 focus:ring-orange-200"
                : "border-red-400 focus:border-red-400 focus:ring-red-100"
            }`}
          placeholder="Twoja odpowiedź"
          rows={3}
          disabled={isDisabled}
        />
        {!isDisabled &&
          (isLoading ? (
            <div className="absolute right-4 bottom-4">
              <ProgressSpinner />
            </div>
          ) : (
            <button
              onClick={handleCheck}
              className="absolute right-4 bottom-4 text-white bg-orange-100 hover:bg-orange-600 rounded-full px-3 py-1.5 shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-300"
              style={{ marginBottom: '2px' }} // small space from bottom
              title="Sprawdź swoją odpowiedź"
              disabled={!userInput.trim()}
              aria-label="Sprawdź odpowiedź"
              tabIndex={0}
            >
              ❓
            </button>
          ))}
      </div>

      {/* Informacja zwrotna */}
      {isCorrect !== null && (
        <p
          className={`mt-3 text-base font-semibold transition-colors duration-150
            ${isCorrect ? "text-green-600" : "text-red-600"}
          `}
        >
          {isCorrect
            ? "Super! Twoja odpowiedź jest poprawna."
            : "Niestety, spróbuj jeszcze raz!"}
        </p>
      )}

      {/* Wyjaśnienie od LLM */}
      {isCorrect === false && llmExplanation && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-base text-yellow-800">
            <strong>Wskazówka od AI:</strong> {llmExplanation}
          </p>
        </div>
      )}

      {/* Opcjonalnie: Wskazówka */}
      {/* {hint && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-base text-blue-700">
            <strong>Wskazówka:</strong> {hint}
          </p>
        </div>
      )} */}
    </div>
  );
}

export default DoTaskComponent;
