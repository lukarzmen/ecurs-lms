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
  onComplete, // Use callback
}: QuestionAnswerComponentProps) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    initialCompleted ? true : null
  );
  const [showAnswer, setShowAnswer] = useState(initialCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);

  useEffect(() => {
    setIsCorrect(initialCompleted ? true : null);
    setShowAnswer(initialCompleted);
    setLlmExplanation(null); // Reset explanation if initial state changes
  }, [initialCompleted]);

  const handleCheck = async () => {
    if (!userInput.trim()) {
      return;
    }
    setIsLoading(true);
    setIsCorrect(null); // Reset visual state before check
    setLlmExplanation(null); // Reset LLM explanation

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPrompt: ``,
          systemPrompt: `Zweryfikuj poprawność odpowiedzi użytkownika na podstawie pytania i wyjaśnienia (jeśli istnieje).
Bądź zwięzły.
Odpowiedz "true", jeśli odpowiedź jest poprawna.
Odpowiedz "false: [twoje wyjaśnienie]", jeśli odpowiedź jest niepoprawna, podając krótkie wyjaśnienie dlaczego.
Na przykład: "false: Stolicą Francji jest Paryż, a nie Berlin."
###
pytanie: ${question}
###
odpowiedź użytkownika: ${userInput.trim()}
###
wyjaśnienie: ${explanation || "Brak dodatkowego wyjaśnienia dla poprawnej odpowiedzi."}
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

      if (textLower.startsWith("true")) {
        isVerifiedCorrect = true;
      } else if (textLower.startsWith("false")) {
        isVerifiedCorrect = false;
        const colonIndex = text.indexOf(":");
        if (colonIndex > -1) {
          explanationFromLlm = text.substring(colonIndex + 1).trim();
        }
      } else {
        console.warn("Nieoczekiwany format odpowiedzi LLM:", text);
        isVerifiedCorrect = false;
        explanationFromLlm =
          "Nie udało się zweryfikować odpowiedzi. Spróbuj ponownie.";
      }

      setLlmExplanation(explanationFromLlm);
      setIsCorrect(isVerifiedCorrect);
      onComplete(isVerifiedCorrect);
      if (isVerifiedCorrect) {
        setShowAnswer(true);
      }
    } catch (error) {
      console.error("Weryfikacja nie powiodła się:", error);
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
      {/* Label: Pytanie */}
      <label className="block text-gray-700 font-semibold mb-1 text-base" htmlFor="qa-question">
        Pytanie:
      </label>
      <p id="qa-question" className="text-gray-900 font-bold mb-4 text-xl leading-tight">
        {question}
      </p>

      {/* Label: Twoja odpowiedź */}
      <label className="block text-gray-700 font-semibold mb-1 text-base" htmlFor="qa-answer">
        Twoja odpowiedź:
      </label>
      <div className="relative">
        <input
          id="qa-answer"
          type="text"
          value={userInput}
          onChange={(e) => {
            if (isDisabled) return;
            setUserInput(e.target.value);
            setIsCorrect(null);
            setShowAnswer(false);
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
          disabled={isDisabled}
          autoComplete="off"
        />
        {!isDisabled &&
          (isLoading ? (
            <div className="absolute right-16 bottom-2">
              <ProgressSpinner />
            </div>
          ) : (
            <button
              onClick={handleCheck}
              className="absolute right-16 bottom-2 text-white bg-orange-200 hover:bg-orange-600 rounded-full px-3 py-1.5 shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-300"
              title="Sprawdź swoją odpowiedź"
              disabled={!userInput.trim()}
              aria-label="Sprawdź odpowiedź"
              tabIndex={0}
            >
              ❓
            </button>
          ))}

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-xl rounded-full px-2 py-1 transition-colors duration-150
            ${showAnswer
              ? "bg-gray-200 text-orange-600 hover:bg-orange-100"
              : "bg-gray-100 text-gray-600 hover:bg-orange-100"
            }`}
          title={showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
          aria-label={showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
          tabIndex={0}
        >
          {showAnswer ? "🙈" : "👁️"}
        </button>
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

      {/* Poprawna odpowiedź */}
      {showAnswer && (
        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-base text-orange-700">
            <strong>Poprawna odpowiedź:</strong> {answer}
          </p>
          {explanation && (
            <p className="text-base text-gray-700 mt-1">
              <strong>Wyjaśnienie:</strong> {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionAnswerComponent;
