import { LexicalEditor, $getSelection, $isRangeSelection, $getRoot } from "lexical";
import React, { useCallback, useEffect, useState } from "react";
import { TodoItem } from "../../nodes/TodoNode/TodoComponent";
import { INSERT_TODO_COMMAND } from ".";
import toast from "react-hot-toast";
import ProgressSpinner from "../TextGeneratorPlugin/ProgressComponent";

export function InsertTodoDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [title, setTitle] = useState("Lista zadań");
  const [items, setItems] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiSourceText, setAiSourceText] = useState("");
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

  function normalizeGeneratedItems(payload: unknown, expectedCount: number): TodoItem[] {
    if (!Array.isArray(payload)) {
      throw new Error("Model nie zwrócił tablicy zadań.");
    }
    if (payload.length !== expectedCount) {
      throw new Error(`Model powinien zwrócić dokładnie ${expectedCount} zadań.`);
    }

    return payload.map((item, idx) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Niepoprawny format zadania #${idx + 1}.`);
      }
      const obj = item as Record<string, unknown>;
      const text = typeof obj.text === "string" ? obj.text.trim() : "";
      if (!text) {
        throw new Error(`Brak treści zadania #${idx + 1}.`);
      }
      return {
        id: Math.random().toString(36).slice(2),
        text,
        checked: false,
      } satisfies TodoItem;
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
        ? Math.max(1, Math.min(aiItemCount, 20))
        : 1;
      const userPrompt = `Wygeneruj listę zadań: dokładnie ${requestedCount} elementów.
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
        systemPrompt: "Tworzysz krótkie zadania na podstawie tekstu. Zwracasz tylko JSON.",
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
      toast.success(`Wygenerowano ${requestedCount} zadań.`);
    } catch (err) {
      console.error("Todo AI generation error:", err);
      toast.error("Nie udało się wygenerować listy. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddItem = () => {
    if (newText.trim() === "") return;
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), text: newText.trim(), checked: false },
    ]);
    setNewText("");
  };

  const handleCreate = () => {
    if (title.trim() === "" || items.length === 0) return;
    activeEditor.dispatchCommand(
      // Use the command from the plugin
      INSERT_TODO_COMMAND,
      { title: title.trim(), items }
    );
    onClose();
  };

  return (
    <div className="p-4 space-y-4 w-full max-w-lg md:max-w-none md:w-[820px] lg:w-[980px] mx-auto">
      <div className="mb-2 text-lg font-bold text-orange-700">Nowa lista zadań</div>
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
            <div className="font-semibold text-gray-900">Lista z AI</div>
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
                Liczba zadań
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
      <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-2 mb-2"
        placeholder="Tytuł listy (np. Zadania domowe, To Do, Lista)"
      />
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Dodaj zadanie</label>
        <div className="flex flex-col gap-2">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 resize-y min-h-[160px]"
            placeholder="Nowe zadanie..."
            rows={6}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddItem(); } }}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddItem}
              className="px-4 py-2 rounded-md bg-orange-600 text-white font-bold hover:bg-orange-700"
            >
              Dodaj
            </button>
          </div>
        </div>
      </div>
      {items.length > 0 && (
        <ul className="list-disc list-inside space-y-1 mb-2">
          {items.map((item, idx) => (
            <li key={item.id} className="text-sm text-orange-900">{item.text}</li>
          ))}
        </ul>
      )}
      <div className="flex justify-between space-x-4 mt-4">
        <button
          onClick={handleCreate}
          disabled={title.trim() === "" || items.length === 0}
          className={`px-4 py-2 rounded-md text-white ${title.trim() !== "" && items.length > 0 ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"}`}
        >
          Utwórz listę
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
