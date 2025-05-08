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
    <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow">
      {/* Pytanie */}
      <p className="text-gray-800 font-bold mb-2 text-xl">{question}</p>

      {/* Pole tekstowe */}
      <div className="relative">
        <input
          type="text"
          value={userInput}
          onChange={(e) => {
            if (isDisabled) return;
            setUserInput(e.target.value);
            setIsCorrect(null);
            setShowAnswer(false);
            setLlmExplanation(null);
          }}
          className={`w-full border rounded-md p-2 pr-16 focus:outline-none ${
            isDisabled
              ? "border-green-500 bg-gray-100 cursor-not-allowed"
              : isCorrect === null
              ? "border-gray-300"
              : "border-red-500"
          }`}
          placeholder="Twoja odpowiedź"
          disabled={isDisabled}
        />
        {!isDisabled &&
          (isLoading ? (
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
              <ProgressSpinner />
            </div>
          ) : (
            <button
              onClick={handleCheck}
              className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-orange-600"
              title="Sprawdź swoją odpowiedź"
              disabled={!userInput.trim()}
            >
              ❓
            </button>
          ))}

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-orange-600"
          title={showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
        >
          {showAnswer ? "🙈" : "👁️"}
        </button>
      </div>

      {/* Informacja zwrotna */}
      {isCorrect !== null && (
        <p
          className={`mt-2 text-sm font-medium ${
            isCorrect ? "text-green-600" : "text-red-600"
          }`}
        >
          {isCorrect
            ? "Super! Twoja odpowiedź jest poprawna."
            : "Niestety, spróbuj jeszcze raz!"}
        </p>
      )}

      {/* Wyjaśnienie od LLM */}
      {isCorrect === false && llmExplanation && (
        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-700">
            <strong>Wskazówka od AI:</strong> {llmExplanation}
          </p>
        </div>
      )}

      {/* Poprawna odpowiedź */}
      {showAnswer && (
        <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
          <p className="text-sm text-orange-700">
            <strong>Poprawna odpowiedź:</strong> {answer}
          </p>
          {explanation && (
            <p className="text-sm text-gray-700 mt-1">
              <strong>Wyjaśnienie:</strong> {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionAnswerComponent;
