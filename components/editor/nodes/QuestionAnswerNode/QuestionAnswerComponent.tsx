import React, { useId, useState, useEffect } from "react";
import { CheckCircle2, XCircle, Eye, EyeOff, HelpCircle } from "lucide-react";
import ProgressSpinner from "../../plugins/TextGeneratorPlugin/ProgressComponent";
import { Button } from "@/components/ui/button";

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
  const answerId = useId();
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
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-5">
          {/* Status banner */}
          {isCorrect !== null && (
            <div
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                isCorrect
                  ? "bg-primary/10 border-primary/20 text-foreground"
                  : "bg-destructive/10 border-destructive/20 text-foreground"
              }`}
              role="status"
              aria-live="polite"
            >
              <div
                className={`mt-0.5 rounded-md p-1.5 ${
                  isCorrect ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {isCorrect
                    ? "Świetnie! Twoja odpowiedź jest poprawna."
                    : "Spróbuj ponownie"}
                </div>
                {!isCorrect && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Możesz poprawić odpowiedź i sprawdzić ją ponownie.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Question */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pytanie
            </div>
            <h3 className="mt-2 text-lg font-semibold leading-relaxed">{question}</h3>
          </div>

          {/* Answer input */}
          <div className="space-y-2">
            <label
              htmlFor={answerId}
              className="text-sm font-semibold text-muted-foreground"
            >
              Twoja odpowiedź
            </label>
            <div className="relative">
              <input
                id={answerId}
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
                  if (
                    e.key === "Enter" &&
                    userInput.trim() &&
                    !isDisabled &&
                    !isLoading
                  ) {
                    handleCheck();
                  }
                }}
                className={`w-full border-2 rounded-lg px-4 py-3 pr-28 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors ${
                  isDisabled
                    ? "border-primary/20 bg-muted/40 cursor-not-allowed text-muted-foreground"
                    : isCorrect === null
                      ? "border-border bg-background focus:border-primary"
                      : "border-destructive/40 bg-destructive/5 focus:border-destructive"
                }`}
                placeholder="Wpisz swoją odpowiedź…"
                disabled={isDisabled}
                autoComplete="off"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {!isDisabled &&
                  (isLoading ? (
                    <div className="p-2">
                      <ProgressSpinner />
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant={userInput.trim() ? "default" : "secondary"}
                      onClick={handleCheck}
                      disabled={!userInput.trim()}
                      title="Sprawdź swoją odpowiedź"
                      aria-label="Sprawdź odpowiedź"
                      className={!userInput.trim() ? "opacity-60" : undefined}
                    >
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  ))}

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowAnswer(!showAnswer)}
                  title={showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
                  aria-label={showAnswer ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}
                >
                  {showAnswer ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* LLM explanation */}
          {isCorrect === false && llmExplanation && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">Wskazówka od AI: </span>
                  <span className="text-muted-foreground">{llmExplanation}</span>
                </p>
              </div>
            </div>
          )}

          {/* Correct answer */}
          {showAnswer && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <div>
                    <span className="font-semibold text-foreground">Poprawna odpowiedź: </span>
                    <span className="text-muted-foreground">{answer}</span>
                  </div>
                  {explanation && (
                    <div className="mt-2">
                      <span className="font-semibold text-foreground">Wyjaśnienie: </span>
                      <span className="text-muted-foreground">{explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionAnswerComponent;
