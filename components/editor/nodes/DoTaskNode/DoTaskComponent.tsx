import React, { useId, useState, useEffect } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import ProgressSpinner from "../../plugins/TextGeneratorPlugin/ProgressComponent";
import { DoTaskItem } from "../../plugins/TaskPlugin";
import { Button } from "@/components/ui/button";

// Add props for initial state and callback
interface DoTaskComponentProps {
  task: string;
  hint: string | null;
  items?: DoTaskItem[] | null;
  initialCompleted: boolean;
  onComplete: (isCorrect: boolean) => void;
}

function DoTaskComponent({
    task,
    hint,
  items,
    initialCompleted,
    onComplete
}: DoTaskComponentProps) {
  const answerId = useId();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [correctFlags, setCorrectFlags] = useState<Array<boolean | null>>([]);
  const [showHintFlags, setShowHintFlags] = useState<boolean[]>([]);
  const [llmExplanations, setLlmExplanations] = useState<Array<string | null>>([]);
  const [isLoadingIndex, setIsLoadingIndex] = useState<number | null>(null);
  const normalizedItems = Array.isArray(items) && items.length > 0
    ? items
    : (task ? [{ task, hint: hint ?? null }] : []);
  const currentItem = normalizedItems[currentIndex];
  const isMulti = normalizedItems.length > 1;
  const allCorrect = correctFlags.length > 0 && correctFlags.every((flag) => flag === true);

  useEffect(() => {
      const total = normalizedItems.length || 1;
      setCurrentIndex(0);
      setUserInputs(Array.from({ length: total }, () => ""));
      setCorrectFlags(Array.from({ length: total }, () => (initialCompleted ? true : null)));
        setShowHintFlags(Array.from({ length: total }, () => false));
      setLlmExplanations(Array.from({ length: total }, () => null));
  }, [initialCompleted, normalizedItems.length]);

  const handleCheck = async () => {
    const currentAnswer = userInputs[currentIndex] || "";
    if (!currentAnswer.trim()) {
      return;
    }
    setIsLoadingIndex(currentIndex);
    setCorrectFlags((prev) =>
      prev.map((value, index) => (index === currentIndex ? null : value))
    );
    setLlmExplanations((prev) =>
      prev.map((value, index) => (index === currentIndex ? null : value))
    );

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
instrukcja: ${currentItem?.task ?? ""}
###
odpowiedź_użytkownika: ${currentAnswer.trim()}
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
      
      setLlmExplanations((prev) =>
        prev.map((value, index) => (index === currentIndex ? explanationFromLlm : value))
      );
      setCorrectFlags((prev) =>
        prev.map((value, index) => (index === currentIndex ? isVerifiedCorrect : value))
      );
      const nextFlags = correctFlags.map((value, index) =>
        index === currentIndex ? isVerifiedCorrect : value
      );
      onComplete(nextFlags.length > 0 && nextFlags.every((flag) => flag === true));

    } catch (error) {
      console.error('Weryfikacja nie powiodła się:', error);
      setCorrectFlags((prev) =>
        prev.map((value, index) => (index === currentIndex ? false : value))
      );
      setLlmExplanations((prev) =>
        prev.map((value, index) =>
          index === currentIndex ? "Wystąpił błąd podczas weryfikacji odpowiedzi." : value
        )
      );
      onComplete(false);
    } finally {
      setIsLoadingIndex(null);
    }
  };

  const currentCorrect = correctFlags[currentIndex] ?? null;
  const isDisabled = allCorrect || currentCorrect === true;
  const llmExplanation = llmExplanations[currentIndex] ?? null;

  return (
    <div className="do-task-component max-w-2xl mx-auto mb-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-5">
          {/* Status banner */}
          {currentCorrect !== null && (
            <div
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                currentCorrect
                  ? "bg-primary/10 border-primary/20 text-foreground"
                  : "bg-destructive/10 border-destructive/20 text-foreground"
              }`}
              role="status"
              aria-live="polite"
            >
              <div
                className={`mt-0.5 rounded-md p-1.5 ${
                  currentCorrect ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                }`}
              >
                {currentCorrect ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {currentCorrect
                    ? "Świetnie! Twoje rozwiązanie jest poprawne."
                    : "Spróbuj ponownie"}
                </div>
                {!currentCorrect && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Możesz poprawić odpowiedź i sprawdzić ją ponownie.
                  </div>
                )}
              </div>
            </div>
          )}
          {allCorrect && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-semibold">Wszystkie zadania są poprawne!</span>
            </div>
          )}

          {/* Task */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Treść zadania
            </div>
            {isMulti ? (
              <div className="text-xs font-semibold text-muted-foreground">
                Zadanie {currentIndex + 1} z {normalizedItems.length}
              </div>
            ) : null}
            {isMulti ? (
              <p className="mt-2 text-lg font-semibold leading-relaxed">
                {currentItem?.task ?? ""}
              </p>
            ) : (
              <p className="mt-2 text-lg font-semibold leading-relaxed">
                {normalizedItems[0]?.task ?? task}
              </p>
            )}
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
                value={userInputs[currentIndex] ?? ""}
                onChange={(e) => {
                  if (isDisabled) return;
                  const nextValue = e.target.value;
                  setUserInputs((prev) =>
                    prev.map((value, index) => (index === currentIndex ? nextValue : value))
                  );
                  setCorrectFlags((prev) =>
                    prev.map((value, index) => (index === currentIndex ? null : value))
                  );
                  setLlmExplanations((prev) =>
                    prev.map((value, index) => (index === currentIndex ? null : value))
                  );
                }}
                className={`w-full min-h-[160px] border-2 rounded-lg p-4 pr-14 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors resize-y ${
                  isDisabled
                    ? "border-primary/20 bg-muted/40 cursor-not-allowed text-muted-foreground"
                    : currentCorrect === null
                      ? "border-border bg-background focus:border-primary"
                      : "border-destructive/40 bg-destructive/5 focus:border-destructive"
                }`}
                placeholder="Wpisz swoje rozwiązanie…"
                rows={6}
                disabled={isDisabled}
              />

              {!isDisabled && (
                <div className="absolute right-2 bottom-2">
                  {isLoadingIndex === currentIndex ? (
                    <div className="p-2">
                      <ProgressSpinner />
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant={(userInputs[currentIndex] || "").trim() ? "default" : "secondary"}
                      onClick={handleCheck}
                      disabled={!(userInputs[currentIndex] || "").trim()}
                      title="Sprawdź swoją odpowiedź"
                      aria-label="Sprawdź odpowiedź"
                      className={!(userInputs[currentIndex] || "").trim() ? "opacity-60" : undefined}
                    >
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LLM explanation */}
          {currentCorrect === false && llmExplanation && (
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
          {(isMulti ? currentItem?.hint : hint) && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline"
                onClick={() =>
                  setShowHintFlags((prev) =>
                    prev.map((value, index) =>
                      index === currentIndex ? !value : value
                    )
                  )
                }
              >
                {showHintFlags[currentIndex] ? "Ukryj podpowiedź" : "Pokaż podpowiedź"}
              </button>
              {showHintFlags[currentIndex] && (
                <p className="mt-2 text-sm leading-relaxed">
                  <span className="font-semibold text-foreground">Wskazówka: </span>
                  <span className="text-muted-foreground">{isMulti ? currentItem?.hint : hint}</span>
                </p>
              )}
            </div>
          )}

          {isMulti && (
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                >
                  Wstecz
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(normalizedItems.length - 1, prev + 1)
                    )
                  }
                  disabled={currentIndex >= normalizedItems.length - 1}
                >
                  Dalej
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Udzielone poprawnie: {correctFlags.filter((flag) => flag === true).length}/{normalizedItems.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoTaskComponent;
