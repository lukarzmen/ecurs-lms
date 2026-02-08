import React, { useId, useState, useEffect } from "react";
import { CheckCircle2, XCircle, Eye, EyeOff, HelpCircle } from "lucide-react";
import ProgressSpinner from "../../plugins/TextGeneratorPlugin/ProgressComponent";
import { Button } from "@/components/ui/button";

export type QAItem = {
  question: string;
  answer: string;
  explanation?: string | null;
};

export type QAType = {
  items: QAItem[];
};

// Add props for initial state and callback
interface QuestionAnswerComponentProps {
  question: string;
  answer: string;
  explanation: string | null;
  items?: QAItem[] | null;
  initialCompleted: boolean;
  onComplete: (isCorrect: boolean) => void;
}

function QuestionAnswerComponent({
  question,
  answer,
  explanation,
  items,
  initialCompleted, // Use initial state
  onComplete, // Use callback
}: QuestionAnswerComponentProps) {
  const answerId = useId();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [correctFlags, setCorrectFlags] = useState<Array<boolean | null>>([]);
  const [showAnswerFlags, setShowAnswerFlags] = useState<boolean[]>([]);
  const [llmExplanations, setLlmExplanations] = useState<Array<string | null>>([]);
  const [isLoadingIndex, setIsLoadingIndex] = useState<number | null>(null);
  const normalizedItems = Array.isArray(items) && items.length > 0
    ? items
    : (question ? [{ question, answer, explanation: explanation ?? null }] : []);
  const currentItem = normalizedItems[currentIndex];
  const isMulti = normalizedItems.length > 1;
  const allCorrect = correctFlags.length > 0 && correctFlags.every((flag) => flag === true);

  useEffect(() => {
    const total = normalizedItems.length || 1;
    setCurrentIndex(0);
    setUserInputs(Array.from({ length: total }, () => ""));
    setCorrectFlags(Array.from({ length: total }, () => (initialCompleted ? true : null)));
    setShowAnswerFlags(Array.from({ length: total }, () => initialCompleted));
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
pytanie: ${currentItem?.question ?? ""}
###
odpowiedź użytkownika: ${currentAnswer.trim()}
###
wyjaśnienie: ${currentItem?.explanation ?? "Brak dodatkowego wyjaśnienia dla poprawnej odpowiedzi."}
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

      setLlmExplanations((prev) =>
        prev.map((value, index) => (index === currentIndex ? explanationFromLlm : value))
      );
      setCorrectFlags((prev) =>
        prev.map((value, index) => (index === currentIndex ? isVerifiedCorrect : value))
      );
      setShowAnswerFlags((prev) =>
        prev.map((value, index) => (index === currentIndex ? isVerifiedCorrect : value))
      );
      const nextFlags = correctFlags.map((value, index) =>
        index === currentIndex ? isVerifiedCorrect : value
      );
      onComplete(nextFlags.length > 0 && nextFlags.every((flag) => flag === true));
    } catch (error) {
      console.error("Weryfikacja nie powiodła się:", error);
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
  const showAnswer = showAnswerFlags[currentIndex] ?? false;
  const llmExplanation = llmExplanations[currentIndex] ?? null;

  return (
    <div className="question-answer-component max-w-2xl mx-auto mb-6">
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
                    ? "Świetnie! Twoja odpowiedź jest poprawna."
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
              <span className="text-sm font-semibold">Wszystkie odpowiedzi są poprawne!</span>
            </div>
          )}

          {/* Question */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pytanie
            </div>
            {isMulti ? (
              <div className="text-xs font-semibold text-muted-foreground">
                Pytanie {currentIndex + 1} z {normalizedItems.length}
              </div>
            ) : null}
            {isMulti ? (
              <h3 className="mt-2 text-lg font-semibold leading-relaxed">
                {currentItem?.question ?? ""}
              </h3>
            ) : (
              <h3 className="mt-2 text-lg font-semibold leading-relaxed">
                {normalizedItems[0]?.question ?? question}
              </h3>
            )}
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
                  setShowAnswerFlags((prev) =>
                    prev.map((value, index) => (index === currentIndex ? false : value))
                  );
                  setLlmExplanations((prev) =>
                    prev.map((value, index) => (index === currentIndex ? null : value))
                  );
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    (e.ctrlKey || e.metaKey) &&
                    (userInputs[currentIndex] || "").trim() &&
                    !isDisabled &&
                    isLoadingIndex === null
                  ) {
                    handleCheck();
                  }
                }}
                className={`w-full min-h-[140px] border-2 rounded-lg px-4 py-3 pr-28 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors resize-y ${
                  isDisabled
                    ? "border-primary/20 bg-muted/40 cursor-not-allowed text-muted-foreground"
                    : currentCorrect === null
                      ? "border-border bg-background focus:border-primary"
                      : "border-destructive/40 bg-destructive/5 focus:border-destructive"
                }`}
                placeholder={isMulti
                  ? "Wpisz odpowiedz dla tego pytania…"
                  : "Wpisz swoją odpowiedź…"}
                disabled={isDisabled}
                autoComplete="off"
                rows={5}
              />

              <div className="absolute right-2 top-3 flex items-center gap-1">
                {!isDisabled &&
                  (isLoadingIndex === currentIndex ? (
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
                  ))}

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setShowAnswerFlags((prev) =>
                      prev.map((value, index) =>
                        index === currentIndex ? !value : value
                      )
                    )
                  }
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

          {/* Correct answer */}
          {showAnswer && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                {isMulti ? (
                  <div className="text-sm leading-relaxed">
                    <div>
                      <span className="font-semibold text-foreground">Poprawna odpowiedź: </span>
                      <span className="text-muted-foreground">{currentItem?.answer ?? ""}</span>
                    </div>
                    {currentItem?.explanation && (
                      <div className="mt-2">
                        <span className="font-semibold text-foreground">Wyjaśnienie: </span>
                        <span className="text-muted-foreground">{currentItem.explanation}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed">
                    <div>
                      <span className="font-semibold text-foreground">Poprawna odpowiedź: </span>
                      <span className="text-muted-foreground">{normalizedItems[0]?.answer ?? answer}</span>
                    </div>
                    {(normalizedItems[0]?.explanation ?? explanation) && (
                      <div className="mt-2">
                        <span className="font-semibold text-foreground">Wyjaśnienie: </span>
                        <span className="text-muted-foreground">
                          {normalizedItems[0]?.explanation ?? explanation}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
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

export default QuestionAnswerComponent;
