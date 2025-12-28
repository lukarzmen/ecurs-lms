import { LexicalEditor, $getSelection, $isRangeSelection } from "lexical";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Test } from "../../nodes/QuizNode/QuizComponent";
import { INSERT_TEST_COMMAND } from ".";
import toast from "react-hot-toast";
import ProgressSpinner from "../TextGeneratorPlugin/ProgressComponent";
import { Textarea } from "@/components/ui/textarea";
import { useCourseContext } from "../../context/CourseContext";


export function InsertQuizDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const { module } = useCourseContext();
  const [sourceText, setSourceText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [current, setCurrent] = useState<Test>({
    question: "",
    answers: ["", "", "", ""],
    correctAnswerIndex: null,
    correctAnswerDescription: null,
  });
  const [step, setStep] = useState(0);

  const defaultContextText = useMemo(() => {
    const parts: string[] = [];
    if (module?.courseName) parts.push(`Kurs: ${module.courseName}`);
    if (module?.moduleName) parts.push(`Lekcja/Moduł: ${module.moduleName}`);
    return parts.join("\n");
  }, [module?.courseName, module?.moduleName]);

  const refreshSelectionIntoSource = useCallback(() => {
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setSourceText(selection.getTextContent());
      } else {
        setSourceText("");
      }
    });
  }, [activeEditor]);

  useEffect(() => {
    // Initialize textarea from selection if available; otherwise fall back to course context.
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent();
        const trimmed = text.trim();
        if (trimmed) {
          setSourceText(text);
          setIsAiOpen(true); // if user has selection, auto-open for convenience
          return;
        }
      }
      // No selection: keep AI collapsed by default, but prefill context if we have it.
      setSourceText(defaultContextText);
      setIsAiOpen(false);
    });
  }, [activeEditor, defaultContextText]);

  const systemPrompt = useMemo(
    () =>
      "Jesteś pomocnym asystentem nauczyciela. Tworzysz krótkie quizy sprawdzające zrozumienie treści. Zwracasz WYŁĄCZNIE poprawny JSON bez Markdown, bez komentarzy.",
    [],
  );

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

  function normalizeTests(payload: unknown): Test[] {
    if (!Array.isArray(payload)) {
      throw new Error("Model nie zwrócił tablicy pytań.");
    }
    if (payload.length !== 5) {
      throw new Error("Model powinien zwrócić dokładnie 5 pytań.");
    }

    return payload.map((item, idx) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Niepoprawny format pytania #${idx + 1}.`);
      }
      const obj = item as Record<string, unknown>;
      const question = typeof obj.question === "string" ? obj.question.trim() : "";
      const answers = Array.isArray(obj.answers)
        ? obj.answers.map((a) => (typeof a === "string" ? a.trim() : ""))
        : [];
      const correctAnswerIndexRaw = obj.correctAnswerIndex;
      const correctAnswerIndex =
        typeof correctAnswerIndexRaw === "number" && Number.isInteger(correctAnswerIndexRaw)
          ? correctAnswerIndexRaw
          : null;
      const correctAnswerDescription =
        obj.correctAnswerDescription === null || obj.correctAnswerDescription === undefined
          ? null
          : typeof obj.correctAnswerDescription === "string"
            ? obj.correctAnswerDescription.trim() || null
            : null;

      if (!question) {
        throw new Error(`Brak treści pytania #${idx + 1}.`);
      }
      if (answers.length !== 4 || answers.some((a) => !a)) {
        throw new Error(`Pytanie #${idx + 1} musi mieć 4 niepuste odpowiedzi.`);
      }
      if (correctAnswerIndex === null || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
        throw new Error(`Pytanie #${idx + 1} ma niepoprawny correctAnswerIndex (0-3).`);
      }

      return {
        question,
        answers,
        correctAnswerIndex,
        correctAnswerDescription,
      } satisfies Test;
    });
  }

  const handleGenerateFromSource = async () => {
    const text = sourceText.trim();
    const hasText = Boolean(text);
    const hasContext = Boolean(module?.courseName || module?.moduleName);
    if (!hasText && !hasContext) {
      toast.error("Zaznacz tekst w edytorze albo uzupełnij kontekst lekcji przed generowaniem quizu.");
      return;
    }

    setIsGenerating(true);
    try {
      const userPrompt = `Wygeneruj quiz: dokładnie 5 pytań, każde z 4 odpowiedziami (A-D).
Zwróć WYŁĄCZNIE poprawny JSON (bez Markdown), w formacie tablicy 5 obiektów:
[
  {
    "question": "...",
    "answers": ["A...", "B...", "C...", "D..."],
    "correctAnswerIndex": 0,
    "correctAnswerDescription": "opcjonalne krótkie wyjaśnienie albo null"
  }
]

Kontekst lekcji (jeśli dostępny):
Kurs: ${module?.courseName ?? "(brak)"}
Lekcja/Moduł: ${module?.moduleName ?? "(brak)"}

Tekst źródłowy (jeśli podany):
"""
${hasText ? text : "(brak - oprzyj pytania na kontekście lekcji)"}
"""`;

      const payload: LLMPrompt = {
        systemPrompt,
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
      const generatedTests = normalizeTests(parsed);

      activeEditor.dispatchCommand(INSERT_TEST_COMMAND, {
        tests: generatedTests,
      });
      toast.success("Wygenerowano quiz (5 pytań) i wstawiono do edytora.");
      onClose();
    } catch (err) {
      console.error("Quiz AI generation error:", err);
      toast.error("Nie udało się wygenerować quizu. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
    }
  };

  const onAnswerChange = (index: number, value: string) => {
    setCurrent((prev) => {
      const updatedAnswers = [...prev.answers];
      updatedAnswers[index] = value;
      return { ...prev, answers: updatedAnswers };
    });
  };

  const isFormValid =
    current.question.trim() !== "" &&
    current.answers.every((answer) => answer.trim() !== "") &&
    current.correctAnswerIndex !== null;

  const canFinish = tests.length > 0 || isFormValid;

  const handleAddQuestion = () => {
    if (!isFormValid) return;
    setTests((prev) => [...prev, { ...current, question: current.question.trim(), answers: current.answers.map(a => a.trim()), correctAnswerDescription: current.correctAnswerDescription?.trim() || null }]);
    setCurrent({
      question: "",
      answers: ["", "", "", ""],
      correctAnswerIndex: null,
      correctAnswerDescription: null,
    });
    setStep(step + 1);
  };

  const handleFinish = () => {
    if (isFormValid) {
      // Add last question if not yet added
      handleAddQuestion();
    }
    if (tests.length > 0 || isFormValid) {
      const allTests = isFormValid ? [...tests, { ...current, question: current.question.trim(), answers: current.answers.map(a => a.trim()), correctAnswerDescription: current.correctAnswerDescription?.trim() || null }] : tests;
      activeEditor.dispatchCommand(INSERT_TEST_COMMAND, {
        tests: allTests,
      });
      onClose();
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
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
            <div className="font-semibold text-gray-900">Quiz z AI</div>
            <div className="text-xs font-semibold text-orange-700">
              {isAiOpen ? "Ukryj" : "Rozwiń"}
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {sourceText.trim()
              ? "Użyje zaznaczenia lub tekstu z pola poniżej."
              : module?.courseName || module?.moduleName
                ? "Brak zaznaczenia — użyje kontekstu lekcji (możesz też wkleić tekst)."
                : "Najlepiej zaznacz fragment tekstu w edytorze."}
          </div>
        </button>

        {isAiOpen ? (
          <>
            <div className="text-xs text-gray-500">
              Jeśli masz zaznaczenie w edytorze — pokaże się tutaj. Jeśli nie, możesz wygenerować quiz na podstawie kontekstu lekcji.
            </div>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={
                module?.courseName || module?.moduleName
                  ? "Brak zaznaczenia — możesz wkleić tekst, albo użyć kontekstu lekcji."
                  : "Zaznacz tekst w edytorze, żeby wygenerować quiz..."
              }
              className="min-h-[120px]"
              disabled={isGenerating}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={refreshSelectionIntoSource}
                disabled={isGenerating}
                className={`px-3 py-2 rounded-md border ${isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
              >
                Pobierz zaznaczenie
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
                  "Wygeneruj 5 pytań"
                )}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <hr className="border-gray-200" />
      <div className="mb-2 text-lg font-bold text-orange-700">Pytanie {step + 1}</div>
      <div className="grid grid-cols-2 gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Zadaj pytanie</label>
        <textarea
          value={current.question}
          onChange={(e) => setCurrent((prev) => ({ ...prev, question: e.target.value }))}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Wpisz swoje pytanie"
          rows={3}
        />

        {current.answers.map((answer, index) => (
          <React.Fragment key={index}>
            <label className="text-sm font-medium text-gray-700">
              Odpowiedź {String.fromCharCode(65 + index)}
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => onAnswerChange(index, e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder={`Odpowiedź ${String.fromCharCode(65 + index)}`}
            />
          </React.Fragment>
        ))}

        <label className="text-sm font-medium text-gray-700">
          Poprawna odpowiedź
        </label>
        <select
          value={current.correctAnswerIndex !== null ? current.correctAnswerIndex.toString() : ""}
          onChange={(e) =>
            setCurrent((prev) => ({
              ...prev,
              correctAnswerIndex: e.target.value ? parseInt(e.target.value, 10) : null,
            }))
          }
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        >
          <option value="" disabled>
            Wybierz poprawną odpowiedź
          </option>
          {current.answers.map((_, index) => (
            <option key={index} value={index}>
              {String.fromCharCode(65 + index)}
            </option>
          ))}
        </select>

        <label className="text-sm font-medium text-gray-700">
          Opis odpowiedzi (opcjonalnie)
        </label>
        <input
          type="text"
          value={current.correctAnswerDescription || ""}
          onChange={(e) =>
            setCurrent((prev) => ({
              ...prev,
              correctAnswerDescription: e.target.value,
            }))
          }
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Dodatkowe szczegóły dotyczące poprawnej odpowiedzi (opcjonalnie)"
        />
      </div>

      <div className="flex justify-between space-x-4 mt-4">
        <button
          onClick={handleAddQuestion}
          disabled={!isFormValid}
          className={`px-4 py-2 rounded-md text-white ${isFormValid ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-400"
            }`}
        >
          Dodaj kolejne pytanie
        </button>
        <button
          onClick={handleFinish}
          // Utwórz quiz dostępny, gdy istnieje przynajmniej jedno kompletne pytanie
          disabled={!canFinish}
          className={`px-4 py-2 rounded-md text-white ${canFinish ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
            }`}
        >
          Zakończ dodawanie i utwórz quiz
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Anuluj
        </button>
      </div>
      {tests.length > 0 && (
        <div className="mt-4">
          <div className="font-semibold mb-2">Dodane pytania:</div>
          <ul className="list-decimal list-inside space-y-1">
            {tests.map((t, idx) => (
              <li key={idx} className="text-sm">{t.question}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
