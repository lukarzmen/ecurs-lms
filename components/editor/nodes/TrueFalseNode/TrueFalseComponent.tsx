import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export interface TrueFalseQuestion {
  question: string;
  correctAnswer: boolean;
  explanation?: string | null;
}

interface TrueFalseComponentProps {
  questions: TrueFalseQuestion[];
  initialSelections: Array<boolean | null>;
  initialCompleted: boolean;
  onSelect: (index: number, value: boolean | null) => void;
  onComplete: (isCorrect: boolean) => void;
}

function normalizeQuestions(questions: TrueFalseQuestion[]): TrueFalseQuestion[] {
  return (Array.isArray(questions) ? questions : [])
    .map((item) => {
      const question = typeof item?.question === "string" ? item.question.trim() : "";
      if (!question) return null;
      const correctAnswer = Boolean(item?.correctAnswer);
      const explanation =
        item?.explanation === null || item?.explanation === undefined
          ? null
          : typeof item?.explanation === "string"
            ? item.explanation.trim() || null
            : null;
      return { question, correctAnswer, explanation } satisfies TrueFalseQuestion;
    })
    .filter(Boolean) as TrueFalseQuestion[];
}

export default function TrueFalseComponent({
  questions,
  initialSelections,
  initialCompleted,
  onSelect,
  onComplete,
}: TrueFalseComponentProps) {
  const groupId = useId();
  const normalizedQuestions = useMemo(() => normalizeQuestions(questions), [questions]);
  const [selections, setSelections] = useState<Array<boolean | null>>([]);
  const onCompleteRef = useRef(onComplete);
  const lastReportedRef = useRef<boolean | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const nextSelections = normalizedQuestions.map((_, index) =>
      initialSelections?.[index] ?? null,
    );
    setSelections(nextSelections);
  }, [initialSelections, normalizedQuestions]);

  const correctnessFlags = useMemo(
    () =>
      normalizedQuestions.map((item, index) => {
        const selection = selections[index];
        if (selection === null || selection === undefined) return null;
        return selection === item.correctAnswer;
      }),
    [normalizedQuestions, selections],
  );

  const allAnswered = correctnessFlags.length > 0 && correctnessFlags.every((flag) => flag !== null);
  const allCorrect = allAnswered && correctnessFlags.every((flag) => flag === true);

  useEffect(() => {
    if (normalizedQuestions.length === 0) {
      if (lastReportedRef.current !== false) {
        onCompleteRef.current(false);
        lastReportedRef.current = false;
      }
      return;
    }
    if (lastReportedRef.current !== allCorrect) {
      onCompleteRef.current(allCorrect);
      lastReportedRef.current = allCorrect;
    }
  }, [allCorrect, normalizedQuestions.length]);

  const handleSelect = (index: number, value: boolean) => {
    if (initialCompleted) return;
    setSelections((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    onSelect(index, value);
  };

  return (
    <div className="true-false-component max-w-2xl mx-auto">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Prawda / fałsz
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-relaxed">
                Zaznacz poprawną odpowiedź dla każdego pytania
              </h3>
            </div>
            {allCorrect && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Poprawnie
              </div>
            )}
          </div>

          {normalizedQuestions.length === 0 ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              Brak pytań do wyświetlenia.
            </div>
          ) : (
            <div className="space-y-4">
              {normalizedQuestions.map((item, index) => {
                const correctness = correctnessFlags[index];
                const selection = selections[index];
                const isDisabled = initialCompleted || allCorrect;

                return (
                  <div key={`${groupId}-${index}`} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Pytanie {index + 1}
                        </div>
                        <div className="mt-2 text-sm font-medium leading-relaxed">
                          {item.question}
                        </div>
                      </div>
                      {correctness !== null && (
                        <div
                          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                            correctness
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {correctness ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {correctness ? "Poprawnie" : "Błędnie"}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm font-medium">
                        <input
                          type="radio"
                          name={`${groupId}-${index}`}
                          value="true"
                          checked={selection === true}
                          onChange={() => handleSelect(index, true)}
                          disabled={isDisabled}
                          className="h-4 w-4"
                        />
                        Prawda
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm font-medium">
                        <input
                          type="radio"
                          name={`${groupId}-${index}`}
                          value="false"
                          checked={selection === false}
                          onChange={() => handleSelect(index, false)}
                          disabled={isDisabled}
                          className="h-4 w-4"
                        />
                        Fałsz
                      </label>
                    </div>

                    {correctness === false && item.explanation && (
                      <div className="mt-3 rounded-md border border-red-100 bg-red-50/70 p-3 text-xs text-red-700">
                        <span className="font-semibold">Wyjaśnienie: </span>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
