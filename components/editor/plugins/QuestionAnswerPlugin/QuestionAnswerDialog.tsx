import { LexicalEditor, $getSelection, $isRangeSelection, $getRoot } from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { INSERT_QA_COMMAND } from '.';
import toast from 'react-hot-toast';
import ProgressSpinner from '../TextGeneratorPlugin/ProgressComponent';


export function QuestionAnswerDialog({
  activeEditor, onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [items, setItems] = useState<Array<{ question: string; answer: string; explanation: string }>>([
    { question: '', answer: '', explanation: '' },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = items[currentIndex];
  const hasValidItems = items.some(
    (item) => item.question.trim() !== '' && item.answer.trim() !== ''
  );
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiSourceText, setAiSourceText] = useState('');
  const [aiItemCount, setAiItemCount] = useState(1);
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

  function normalizeGeneratedItems(payload: unknown, expectedCount: number) {
    if (!Array.isArray(payload)) {
      throw new Error('Model nie zwrócił tablicy pytań.');
    }
    if (payload.length !== expectedCount) {
      throw new Error(`Model powinien zwrócić dokładnie ${expectedCount} pytań.`);
    }

    return payload.map((item, idx) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Niepoprawny format pytania #${idx + 1}.`);
      }
      const obj = item as Record<string, unknown>;
      const question = typeof obj.question === 'string' ? obj.question.trim() : '';
      const answer = typeof obj.answer === 'string' ? obj.answer.trim() : '';
      const explanationValue = obj.explanation;
      const explanationText =
        explanationValue === null || explanationValue === undefined
          ? ''
          : typeof explanationValue === 'string'
            ? explanationValue.trim()
            : '';

      if (!question || !answer) {
        throw new Error(`Pytanie #${idx + 1} musi mieć treść i odpowiedź.`);
      }

      return { question, answer, explanation: explanationText };
    });
  }

  const handleGenerateFromSource = async () => {
    const text = aiSourceText.trim();
    if (!text) {
      toast.error('Podaj tekst źródłowy lub zaznacz fragment w edytorze.');
      return;
    }

    setIsGenerating(true);
    try {
      const requestedCount = Number.isFinite(aiItemCount)
        ? Math.max(1, Math.min(aiItemCount, 20))
        : 1;
      const userPrompt = `Wygeneruj zestaw pytań i odpowiedzi: dokładnie ${requestedCount} elementów.
Zwróć WYŁĄCZNIE poprawny JSON (bez Markdown), w formacie tablicy ${requestedCount} obiektów:
[
  {
    "question": "...",
    "answer": "...",
    "explanation": "opcjonalne wyjaśnienie albo null"
  }
]

Tekst źródłowy:
"""
${text}
"""`;

      const payload = {
        systemPrompt: "Tworzysz krótkie pytania i odpowiedzi na podstawie tekstu. Zwracasz tylko JSON.",
        userPrompt,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('API error');
      }

      const raw = await res.text();
      const parsed = extractJsonArray(raw);
      const generatedItems = normalizeGeneratedItems(parsed, requestedCount);

      setItems(generatedItems);
      setCurrentIndex(0);
      toast.success(`Wygenerowano ${requestedCount} pytań.`);
    } catch (err) {
      console.error('QA AI generation error:', err);
      toast.error('Nie udało się wygenerować pytań. Spróbuj ponownie.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateCurrentItem = (field: 'question' | 'answer' | 'explanation', value: string) => {
    setItems((prev) =>
      prev.map((item, index) =>
        index === currentIndex ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddItem = () => {
    setItems((prev) => {
      const next = [...prev, { question: '', answer: '', explanation: '' }];
      setCurrentIndex(next.length - 1);
      return next;
    });
  };

  const handleRemoveItem = () => {
    if (items.length <= 1) return;
    setItems((prev) => {
      const next = prev.filter((_, index) => index !== currentIndex);
      const nextIndex = Math.min(currentIndex, next.length - 1);
      setCurrentIndex(Math.max(0, nextIndex));
      return next;
    });
  };
  const handleOnClick = () => {
    const normalizedItems = items
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
        explanation: item.explanation.trim() || null,
      }))
      .filter((item) => item.question !== '' && item.answer !== '');
    const effectiveItems = normalizedItems.length > 0 ? normalizedItems : null;
    activeEditor.dispatchCommand(INSERT_QA_COMMAND, {
      items: effectiveItems ?? [],
    });
    onClose();
  };

  return (
    <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
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
            <div className="font-semibold text-gray-900">Pytania z AI</div>
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
                  value={aiItemCount}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    if (!Number.isFinite(nextValue)) {
                      setAiItemCount(1);
                      return;
                    }
                    setAiItemCount(Math.max(1, Math.min(nextValue, 20)));
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
          Element {currentIndex + 1} z {items.length}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRemoveItem}
            disabled={items.length <= 1}
            className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Usun
          </button>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1.5 rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            Dodaj
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_3fr] gap-4 items-start"> {/* Changed items-center to items-start for better label alignment */}
        {/* Question */}
        <label className="text-sm font-medium text-gray-700 text-left pt-2">Pytanie:</label> {/* Added pt-2 for alignment */}
        <textarea
          value={currentItem.question}
          onChange={(e) => updateCurrentItem('question', e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 resize-y min-h-[120px]" // Added resize-y and min-h
          placeholder="Wpisz swoje pytanie"
          rows={6} // Added rows attribute
        />
        {/* Answer */}
        <label className="text-sm font-medium text-gray-700 text-left pt-2">Odpowiedź:</label> {/* Added pt-2 for alignment */}
        <textarea
          value={currentItem.answer}
          onChange={(e) => updateCurrentItem('answer', e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 resize-y min-h-[120px]" // Added resize-y and min-h
          placeholder="Wpisz poprawną odpowiedź"
          rows={6} // Added rows attribute
        />
         {/* Explanation */}
        <label className="text-sm font-medium text-gray-700 text-left pt-2">Wyjaśnienie:</label> {/* Added pt-2 for alignment */}
        <textarea
          value={currentItem.explanation}
          onChange={(e) => updateCurrentItem('explanation', e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 resize-y min-h-[60px]" // Added resize-y and min-h
          placeholder="Wpisz wyjaśnienie (opcjonalnie)"
          rows={3} // Added rows attribute
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Wstecz
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
            disabled={currentIndex >= items.length - 1}
            className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Dalej
          </button>
        </div>
        <div className="text-xs text-gray-500">Kreator elementu</div>
      </div>

      <div className="flex justify-end space-x-4">
        {/* Confirm Button */}
        <button
          disabled={!hasValidItems}
          onClick={handleOnClick}
          className={`px-4 py-2 rounded-md text-white ${
            !hasValidItems
              ? 'bg-gray-400 cursor-not-allowed' // Added cursor-not-allowed
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          Potwierdź
        </button>
        {/* Cancel Button */}
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
