import { LexicalEditor, $getSelection, $getRoot, $isRangeSelection } from "lexical";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProgressSpinner from "../TextGeneratorPlugin/ProgressComponent";
import { INSERT_TRUE_FALSE_COMMAND } from ".";
import { TrueFalseQuestion } from "../../nodes/TrueFalseNode/TrueFalseComponent";

const EMPTY_QUESTION: TrueFalseQuestion = {
  question: "",
  correctAnswer: true,
  explanation: null,
};

export function InsertTrueFalseDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [questions, setQuestions] = useState<TrueFalseQuestion[]>([]);
  const [current, setCurrent] = useState<TrueFalseQuestion>(EMPTY_QUESTION);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUsingFullContext, setIsUsingFullContext] = useState(false);

  const refreshSelectionIntoSource = useCallback(() => {
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setAiSourceText(selection.getTextContent());
        setIsUsingFullContext(false);
      } else {
        const fullText = $getRoot().getTextContent();
        setAiSourceText(fullText);
        setIsUsingFullContext(Boolean(fullText.trim()));
      }
    });
  }, [activeEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent();
        if (text.trim()) {
          setAiSourceText(text);
          setIsAiOpen(true);
          setIsUsingFullContext(false);
          return;
        }
      }
      const fullText = $getRoot().getTextContent();
      if (fullText.trim()) {
        setAiSourceText(fullText);
        setIsUsingFullContext(true);
      }
    });
  }, [activeEditor]);

  function extractJsonArray(text: string): unknown {
    const trimmed = text.trim();
    const withoutFences = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const start = withoutFences.indexOf("[");
    const end = withoutFences.lastIndexOf("]");
    const candidate =
      start !== -1 && end !== -1 && end > start
        ? withoutFences.slice(start, end + 1)
        : withoutFences;

    return JSON.parse(candidate);
  }

  function normalizeGeneratedQuestions(payload: unknown, expectedCount: number): TrueFalseQuestion[] {
    if (!Array.isArray(payload)) {
      throw new Error("Model nie zwrócił tablicy pytań.");
    }
    if (payload.length !== expectedCount) {
      throw new Error(`Model powinien zwrócić dokładnie ${expectedCount} pytań.`);
    }

    return payload.map((item, idx) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Niepoprawny format pytania #${idx + 1}.`);
      }
      const obj = item as Record<string, unknown>;
      const question = typeof obj.question === "string" ? obj.question.trim() : "";
      const correctAnswer = typeof obj.correctAnswer === "boolean" ? obj.correctAnswer : null;
      const explanation =
        obj.explanation === null || obj.explanation === undefined
          ? null
          : typeof obj.explanation === "string"
            ? obj.explanation.trim() || null
            : null;

      if (!question) {
        throw new Error(`Brak treści pytania #${idx + 1}.`);
      }
      if (correctAnswer === null) {
        throw new Error(`Pytanie #${idx + 1} ma niepoprawną wartość correctAnswer.`);
      }

      return {
        question,
        correctAnswer,
        explanation,
      } satisfies TrueFalseQuestion;
    });
  }

  const handleGenerateFromSource = async () => {
    const text = aiSourceText.trim();
    if (!text) {
      toast.error("Podaj tekst źródłowy lub zaznacz fragment w edytorze.");
      return;
    }

    setIsGenerating(true);
    try {
      const requestedCount = Number.isFinite(aiQuestionCount)
        ? Math.max(1, Math.min(aiQuestionCount, 20))
        : 5;
      const userPrompt = `Wygeneruj pytania prawda/fałsz: dokładnie ${requestedCount} pytań.
Zwróć WYŁĄCZNIE poprawny JSON (bez Markdown), w formacie tablicy ${requestedCount} obiektów:
[
  {
    "question": "...",
    "correctAnswer": true,
    "explanation": "opcjonalne krótkie wyjaśnienie albo null"
  }
]

Tekst źródłowy:
"""
${text}
"""`;

      const payload = {
        systemPrompt: "Tworzysz pytania prawda/fałsz. Zwróć tylko JSON.",
        userPrompt,
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("API error");
      }

      const raw = await res.text();
      const parsed = extractJsonArray(raw);
      const generatedQuestions = normalizeGeneratedQuestions(parsed, requestedCount);

      setQuestions(generatedQuestions);
      toast.success(`Wygenerowano ${requestedCount} pytań.`);
    } catch (err) {
      console.error("True/False AI generation error:", err);
      toast.error("Nie udało się wygenerować pytań. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = current.question.trim() !== "";
  const canFinish = questions.length > 0 || isFormValid;

  const handleAddQuestion = () => {
    if (!isFormValid) return;
    setQuestions((prev) => [
      ...prev,
      {
        question: current.question.trim(),
        correctAnswer: current.correctAnswer,
        explanation: current.explanation?.trim() || null,
      },
    ]);
    setCurrent(EMPTY_QUESTION);
  };

  const handleFinish = () => {
    if (isFormValid) {
      handleAddQuestion();
    }
    if (questions.length > 0 || isFormValid) {
      const allQuestions = isFormValid
        ? [
            ...questions,
            {
              question: current.question.trim(),
              correctAnswer: current.correctAnswer,
              explanation: current.explanation?.trim() || null,
            },
          ]
        : questions;
      activeEditor.dispatchCommand(INSERT_TRUE_FALSE_COMMAND, {
        questions: allQuestions,
      });
      onClose();
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsAiOpen((v) => !v)}
          aria-expanded={isAiOpen}
          className={
            "w-full text-left rounded-lg border px-4 py-3 transition-colors " +
            (isAiOpen
              ? "border-orange-300 bg-orange-50"
              : "border-orange-200 bg-orange-50/60 hover:bg-orange-50")
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-gray-900">Prawda/fałsz z AI</div>
            <div className="text-xs font-semibold text-orange-700">
              {isAiOpen ? "Ukryj" : "Rozwiń"}
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            Wklej tekst źródłowy lub pobierz zaznaczenie z edytora.
          </div>
        </button>

        {isAiOpen ? (
          <>
            <textarea
              value={aiSourceText}
              onChange={(e) => {
                setAiSourceText(e.target.value);
                setIsUsingFullContext(false);
              }}
              placeholder="Wklej tekst źródłowy..."
              className="min-h-[120px] w-full rounded-md border border-gray-300 p-2 resize-y"
              disabled={isGenerating}
            />
            {isUsingFullContext && !aiSourceText.trim() && (
              <div className="text-xs text-gray-500">
                Brak tekstu — używam całego kontekstu z edytora.
              </div>
            )}
            {isUsingFullContext && aiSourceText.trim() && (
              <div className="text-xs text-gray-500">
                Brak zaznaczenia — używam całego kontekstu z edytora.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-gray-700">
                Liczba pytań
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={aiQuestionCount}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    if (!Number.isFinite(nextValue)) {
                      setAiQuestionCount(5);
                      return;
                    }
                    setAiQuestionCount(Math.max(1, Math.min(nextValue, 20)));
                  }}
                  disabled={isGenerating}
                  className="ml-2 w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={refreshSelectionIntoSource}
                disabled={isGenerating}
                className={`px-3 py-2 rounded-md border ${isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
              >
                Wczytaj zaznaczenie
              </button>
              <button
                type="button"
                onClick={handleGenerateFromSource}
                disabled={isGenerating}
                className={`px-3 py-2 rounded-md text-white flex items-center gap-2 ${isGenerating ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"}`}
              >
                {isGenerating ? (
                  <>
                    <ProgressSpinner />
                    Generowanie...
                  </>
                ) : (
                  `Wygeneruj ${Number.isFinite(aiQuestionCount)
                    ? Math.max(1, Math.min(aiQuestionCount, 20))
                    : 5} pytań`
                )}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <hr className="border-gray-200" />

      <div className="mb-2 text-lg font-bold text-orange-700">Pytanie prawda/fałsz</div>
      <div className="grid grid-cols-1 gap-4">
        <label className="text-sm font-medium text-gray-700">Treść pytania</label>
        <textarea
          value={current.question}
          onChange={(e) => setCurrent((prev) => ({ ...prev, question: e.target.value }))}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Wpisz treść pytania"
          rows={3}
        />

        <label className="text-sm font-medium text-gray-700">Poprawna odpowiedź</label>
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="radio"
              name="true-false"
              value="true"
              checked={current.correctAnswer === true}
              onChange={() => setCurrent((prev) => ({ ...prev, correctAnswer: true }))}
              className="h-4 w-4"
            />
            Prawda
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="radio"
              name="true-false"
              value="false"
              checked={current.correctAnswer === false}
              onChange={() => setCurrent((prev) => ({ ...prev, correctAnswer: false }))}
              className="h-4 w-4"
            />
            Fałsz
          </label>
        </div>

        <label className="text-sm font-medium text-gray-700">Wyjaśnienie (opcjonalnie)</label>
        <input
          type="text"
          value={current.explanation || ""}
          onChange={(e) => setCurrent((prev) => ({ ...prev, explanation: e.target.value }))}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Dodatkowe wyjaśnienie (opcjonalnie)"
        />
      </div>

      <div className="flex justify-between space-x-4 mt-4">
        <button
          onClick={handleAddQuestion}
          disabled={!isFormValid}
          className={`px-4 py-2 rounded-md text-white ${isFormValid ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-400"}`}
        >
          Dodaj kolejne pytanie
        </button>
        <button
          onClick={handleFinish}
          disabled={!canFinish}
          className={`px-4 py-2 rounded-md text-white ${canFinish ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"}`}
        >
          Zakończ dodawanie i utwórz
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Anuluj
        </button>
      </div>

      {questions.length > 0 && (
        <div className="mt-4">
          <div className="font-semibold mb-2">Dodane pytania:</div>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm text-gray-900">
                    {idx + 1}. {q.question}
                  </div>
                  <div
                    className={`shrink-0 px-2 py-1 rounded text-xs font-semibold ${
                      q.correctAnswer
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {q.correctAnswer ? "Prawda" : "Fałsz"}
                  </div>
                </div>
                {q.explanation && (
                  <div className="mt-2 text-xs text-gray-600 italic">
                    Wyjaśnienie: {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
