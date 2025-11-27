import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Eye, EyeOff, HelpCircle } from "lucide-react";
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
    <div className="question-answer-component max-w-2xl mx-auto mb-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        {/* Status indicator */}
        {isCorrect !== null && (
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-semibold">Świetnie! Twoja odpowiedź jest poprawna!</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-semibold">Spróbuj ponownie</span>
              </>
            )}
          </div>
        )}

        {/* Question */}
        <h3 className="text-xl font-semibold mb-6 leading-relaxed">{question}</h3>

        {/* Answer input */}
        <div className="relative mb-4">
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userInput.trim() && !isDisabled && !isLoading) {
                handleCheck();
              }
            }}
            className={`w-full border-2 rounded-lg p-4 pr-28 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200
              ${isDisabled
                ? "border-emerald-300 bg-emerald-50/50 cursor-not-allowed text-muted-foreground"
                : isCorrect === null
                ? "border-border bg-background focus:border-primary"
                : "border-red-300 bg-red-50/50 focus:border-red-500"
              }`}
            placeholder="Wpisz swoją odpowiedź..."
            disabled={isDisabled}
            autoComplete="off"
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {!isDisabled && (
              isLoading ? (
                <div className="p-2">
                  <ProgressSpinner />
                </div>
              ) : (
                <button
                  onClick={handleCheck}
                  disabled={!userInput.trim()}
                  className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                    ${userInput.trim() 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-95" 
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                    }`}
                  title="Sprawdź swoją odpowiedź"
                  aria-label="Sprawdź odpowiedź"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              )
            )}

            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                ${showAnswer
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              title={showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
              aria-label={showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
            >
              {showAnswer ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* LLM Explanation for incorrect answer */}
        {isCorrect === false && llmExplanation && (
          <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                <span className="font-semibold">Wskazówka od AI: </span>
                {llmExplanation}
              </p>
            </div>
          </div>
        )}

        {/* Correct answer */}
        {showAnswer && (
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">
                <span className="font-semibold text-foreground">Poprawna odpowiedź: </span>
                <span className="text-muted-foreground">{answer}</span>
              </p>
            </div>
            {explanation && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-2 pl-7">
                <span className="font-semibold text-foreground">Wyjaśnienie: </span>
                {explanation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionAnswerComponent;
