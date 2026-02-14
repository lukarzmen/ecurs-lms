import { LexicalEditor, $getSelection, $getRoot, $isRangeSelection } from "lexical";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProgressSpinner from "../TextGeneratorPlugin/ProgressComponent";
import { INSERT_ORDERING_COMMAND } from ".";
import { OrderingItem } from "../../nodes/OrderingNode/OrderingComponent";

export function InsertOrderingDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [items, setItems] = useState<OrderingItem[]>([]);
  const [newText, setNewText] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiItemCount, setAiItemCount] = useState(5);
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

  function normalizeGeneratedItems(payload: unknown, expectedCount: number): OrderingItem[] {
    if (!Array.isArray(payload)) {
      throw new Error("Model nie zwrócił tablicy kroków.");
    }
    if (payload.length !== expectedCount) {
      throw new Error(`Model powinien zwrócić dokładnie ${expectedCount} kroków.`);
    }

    return payload.map((item, idx) => {
      let text = "";
      if (typeof item === "string") {
        text = item.trim();
      } else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        text = typeof obj.text === "string" ? obj.text.trim() : "";
      }
      if (!text) {
        throw new Error(`Brak treści kroku #${idx + 1}.`);
      }
      return {
        id: Math.random().toString(36).slice(2),
        text,
      } satisfies OrderingItem;
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
      const requestedCount = Number.isFinite(aiItemCount)
        ? Math.max(2, Math.min(aiItemCount, 20))
        : 5;
      const userPrompt = `Wygeneruj kroki do ułożenia w poprawnej kolejności: dokładnie ${requestedCount} elementów.
Zwróć WYŁĄCZNIE poprawny JSON (bez Markdown), w formacie tablicy ${requestedCount} obiektów:
[
  {
    "text": "..."
  }
]

Tekst źródłowy:
"""
${text}
"""`;

      const payload = {
        systemPrompt: "Tworzysz listę kroków w poprawnej kolejności. Zwróć tylko JSON.",
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
      const generatedItems = normalizeGeneratedItems(parsed, requestedCount);

      setItems(generatedItems);
      toast.success(`Wygenerowano ${requestedCount} kroków.`);
    } catch (err) {
      console.error("Ordering AI generation error:", err);
      toast.error("Nie udało się wygenerować kroków. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddItem = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), text: trimmed },
    ]);
    setNewText("");
  };

  const moveItem = (from: number, to: number) => {
    setItems((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const canCreate = items.length >= 2;

  const handleCreate = () => {
    if (!canCreate) return;
    activeEditor.dispatchCommand(INSERT_ORDERING_COMMAND, { items });
    onClose();
  };

  return (
    <div className="p-4 space-y-4 w-full max-w-lg md:max-w-none md:w-[820px] lg:w-[980px] mx-auto">
      <div className="mb-2 text-lg font-bold text-orange-700">Nowa kolejność</div>

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
            <div className="font-semibold text-gray-900">Kolejność z AI</div>
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
                Liczba kroków
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={aiItemCount}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    if (!Number.isFinite(nextValue)) {
                      setAiItemCount(5);
                      return;
                    }
                    setAiItemCount(Math.max(2, Math.min(nextValue, 20)));
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
                  `Wygeneruj ${Number.isFinite(aiItemCount)
                    ? Math.max(2, Math.min(aiItemCount, 20))
                    : 5} kroków`
                )}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <hr className="border-gray-200" />

      <div className="space-y-3">
        <div className="text-sm font-semibold text-gray-700">Dodaj krok</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2"
            placeholder="Wpisz treść kroku"
          />
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!newText.trim()}
            className={`px-4 py-2 rounded-md text-white ${newText.trim() ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-400"}`}
          >
            Dodaj
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-700">Poprawna kolejność</div>
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Dodaj przynajmniej dwa kroki.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3">
                <div className="text-sm font-semibold text-gray-600">{index + 1}.</div>
                <div className="flex-1 text-sm text-gray-900">{item.text}</div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    W górę
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, index + 1)}
                    disabled={index === items.length - 1}
                    className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    W dół
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-between space-x-4 mt-4">
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className={`px-4 py-2 rounded-md text-white ${canCreate ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"}`}
        >
          Utwórz element
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
