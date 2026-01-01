import React, { useId, useState, useEffect } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import ProgressSpinner from "../../plugins/TextGeneratorPlugin/ProgressComponent";
import { DoTaskType } from "../../plugins/TaskPlugin";
import { Button } from "@/components/ui/button";

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
  const answerId = useId();
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
    <div className="do-task-component max-w-2xl mx-auto mb-6">
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
                    ? "Świetnie! Twoje rozwiązanie jest poprawne."
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

          {/* Task */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Treść zadania
            </div>
            <p className="mt-2 text-lg font-semibold leading-relaxed">{task}</p>
          </div>

          {/* Answer textarea */}
          <div className="space-y-2">
            <label
              htmlFor={answerId}
              className="text-sm font-semibold text-muted-foreground"
            >
              Twoja odpowiedź
            </label>
            <div className="relative">
              <textarea
                id={answerId}
                value={userInput}
                onChange={(e) => {
                  if (isDisabled) return;
                  setUserInput(e.target.value);
                  setIsCorrect(null);
                  setLlmExplanation(null);
                }}
                className={`w-full min-h-[104px] border-2 rounded-lg p-4 pr-14 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors resize-none ${
                  isDisabled
                    ? "border-primary/20 bg-muted/40 cursor-not-allowed text-muted-foreground"
                    : isCorrect === null
                      ? "border-border bg-background focus:border-primary"
                      : "border-destructive/40 bg-destructive/5 focus:border-destructive"
                }`}
                placeholder="Wpisz swoje rozwiązanie…"
                rows={4}
                disabled={isDisabled}
              />

              {!isDisabled && (
                <div className="absolute right-2 bottom-2">
                  {isLoading ? (
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
                  )}
                </div>
              )}
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

          {/* Optional hint */}
          {hint && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm leading-relaxed">
                <span className="font-semibold text-foreground">Wskazówka: </span>
                <span className="text-muted-foreground">{hint}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoTaskComponent;
