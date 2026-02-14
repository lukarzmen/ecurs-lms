import { $getRoot, $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProgressSpinner from "../TextGeneratorPlugin/ProgressComponent";
import { INSERT_SELECT_ANSWER_NODE_COMMAND } from ".";

export function InsertSelectAnswerDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [answers, setAnswers] = useState<string[]>(["", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiOptionCount, setAiOptionCount] = useState(4);
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

  const onAnswerChange = (index: number, value: string) => {
    setAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[index] = value;
      return updatedAnswers;
    });
  };

  const addAnswer = () => {
    setAnswers((prevAnswers) => [...prevAnswers, ""]);
  };

  const removeAnswer = (index: number) => {
    setAnswers((prevAnswers) => prevAnswers.filter((_, i) => i !== index));
    setCorrectAnswerIndex((prevIndex) => {
      if (prevIndex === null) return null;
      if (prevIndex === index) return null;
      if (prevIndex > index) return prevIndex - 1;
      return prevIndex;
    });
  };

  function extractJsonObject(text: string): unknown {
    const trimmed = text.trim();
    const withoutFences = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const start = withoutFences.indexOf("{");
    const end = withoutFences.lastIndexOf("}");
    const candidate =
      start !== -1 && end !== -1 && end > start
        ? withoutFences.slice(start, end + 1)
        : withoutFences;

    return JSON.parse(candidate);
  }

  function normalizeGeneratedOptions(payload: unknown, expectedCount: number) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Model nie zwrócił obiektu z odpowiedziami.");
    }
    const obj = payload as Record<string, unknown>;
    const optionsValue = obj.options;
    const correctIndexValue = obj.correctIndex;

    if (!Array.isArray(optionsValue)) {
      throw new Error("Model nie zwrócił listy odpowiedzi.");
    }
    if (optionsValue.length !== expectedCount) {
      throw new Error(
        `Model powinien zwrócić dokładnie ${expectedCount} odpowiedzi.`
      );
    }

    const normalizedOptions = optionsValue.map((option, idx) => {
      if (typeof option !== "string") {
        throw new Error(`Niepoprawny format odpowiedzi #${idx + 1}.`);
      }
      const trimmed = option.trim();
      if (!trimmed) {
        throw new Error(`Brak treści odpowiedzi #${idx + 1}.`);
      }
      return trimmed;
    });

    if (!Number.isInteger(correctIndexValue)) {
      throw new Error("Model nie zwrócił poprawnego indeksu odpowiedzi.");
    }

    const correctIndex = Number(correctIndexValue);
    if (correctIndex < 0 || correctIndex >= normalizedOptions.length) {
      throw new Error("Indeks poprawnej odpowiedzi jest poza zakresem.");
    }

    return { options: normalizedOptions, correctIndex };
  }

  const isFormValid =
    answers.length >= 2 &&
    answers.every((answer) => answer.trim() !== "") &&
    correctAnswerIndex !== null;

  const handleGenerateFromSource = async () => {
    const text = aiSourceText.trim();
    if (!text) {
      toast.error("Podaj tekst źródłowy lub zaznacz fragment w edytorze.");
      return;
    }

    setIsGenerating(true);
    try {
      const requestedCount = Number.isFinite(aiOptionCount)
        ? Math.max(2, Math.min(aiOptionCount, 8))
        : 4;
      const userPrompt = `Wygeneruj odpowiedzi do pytania jednokrotnego wyboru: dokładnie ${requestedCount} odpowiedzi.
Zwróć WYŁĄCZNIE poprawny JSON (bez Markdown), w formacie:
{
  "options": ["..."],
  "correctIndex": 0
}

Wymagania:
- "options" ma dokładnie ${requestedCount} krótkich odpowiedzi (string).
- "correctIndex" wskazuje poprawną odpowiedź (0-${requestedCount - 1}).

Tekst źródłowy:
"""
${text}
"""`;

      const payload = {
        systemPrompt:
          "Tworzysz krótkie odpowiedzi jednokrotnego wyboru na podstawie tekstu. Zwracasz tylko JSON.",
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
      const parsed = extractJsonObject(raw);
      const generated = normalizeGeneratedOptions(parsed, requestedCount);

      setAnswers(generated.options);
      setCorrectAnswerIndex(generated.correctIndex);
      toast.success(`Wygenerowano ${requestedCount} odpowiedzi.`);
    } catch (err) {
      console.error("SelectAnswer AI generation error:", err);
      toast.error("Nie udało się wygenerować odpowiedzi. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
    }
  };

  const submitSelectAnswer = () => {
    if (isFormValid) {
      activeEditor.dispatchCommand(INSERT_SELECT_ANSWER_NODE_COMMAND, {
        options: answers.map((a) => a.trim()),
        selectedIndex: correctAnswerIndex,
      });
      onClose();
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
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
            <div className="font-semibold text-gray-900">Odpowiedzi z AI</div>
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
                Liczba odpowiedzi
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={aiOptionCount}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    if (!Number.isFinite(nextValue)) {
                      setAiOptionCount(4);
                      return;
                    }
                    setAiOptionCount(Math.max(2, Math.min(nextValue, 8)));
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
                  "Wygeneruj"
                )}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <hr className="border-gray-200" />

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">
          Odpowiedzi ({answers.length})
        </div>
        <button
          type="button"
          onClick={addAnswer}
          className="px-3 py-1.5 rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100"
        >
          Dodaj odpowiedź
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Zaznacz kółko przy poprawnej odpowiedzi.
      </div>

      <div className="space-y-3">
        {answers.map((answer, index) => (
          <div
            key={index}
            className="flex flex-wrap items-start gap-3 rounded-md border border-gray-200 p-3"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="correct-answer"
                checked={correctAnswerIndex === index}
                onChange={() => setCorrectAnswerIndex(index)}
                className="h-4 w-4"
              />
              {String.fromCharCode(65 + index)}
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => onAnswerChange(index, e.target.value)}
              className="flex-1 min-w-[220px] border border-gray-300 rounded-md p-2"
              placeholder={`Odpowiedź ${String.fromCharCode(65 + index)}`}
            />
            <button
              type="button"
              onClick={() => removeAnswer(index)}
              disabled={answers.length <= 2}
              className="px-2.5 py-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              Usuń
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4 mt-4">
        <button
          onClick={submitSelectAnswer}
          disabled={!isFormValid}
          className={`px-4 py-2 rounded-md text-white ${isFormValid ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-400"
            }`}
        >
          Potwierdź
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}
