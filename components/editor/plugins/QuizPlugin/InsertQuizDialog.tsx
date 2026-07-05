import { LexicalEditor, $getSelection, $isRangeSelection, $getRoot } from "lexical";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Test } from "../../nodes/QuizNode/QuizComponent";
import { INSERT_TEST_COMMAND } from ".";
import toast from "react-hot-toast";
import ProgressSpinner from "../TextGeneratorPlugin/ProgressComponent";
import { Textarea } from "@/components/ui/textarea";
import { useCourseContext } from "../../context/CourseContext";
import { useI18n } from "@/hooks/use-i18n";


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
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [isUsingFullContext, setIsUsingFullContext] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [current, setCurrent] = useState<Test>({
    question: "",
    answers: ["", "", "", ""],
    correctAnswerIndex: null,
    correctAnswerDescription: null,
  });
  const [step, setStep] = useState(0);
  const { t } = useI18n();

  const formatMessage = useCallback(
    (key: string, replacements: Record<string, string | number> = {}) => {
      return Object.entries(replacements).reduce((message, [token, value]) => {
        return message.replaceAll(`{${token}}`, String(value));
      }, t(key));
    },
    [t],
  );

  const defaultContextText = useMemo(() => {
    const parts: string[] = [];
    if (module?.courseName) {
      parts.push(formatMessage('ed.quizContextCourse', {name: module.courseName}));
    }
    if (module?.moduleName) {
      parts.push(formatMessage('ed.quizContextModule', {name: module.moduleName}));
    }
    return parts.join("\n");
  }, [formatMessage, module?.courseName, module?.moduleName]);

  const refreshSelectionIntoSource = useCallback(() => {
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setSourceText(selection.getTextContent());
        setIsUsingFullContext(false);
      } else {
        const fullText = $getRoot().getTextContent();
        setSourceText(fullText);
        setIsUsingFullContext(Boolean(fullText.trim()));
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
          setIsUsingFullContext(false);
          return;
        }
      }
      // No selection: use full editor content as AI context.
      const fullText = $getRoot().getTextContent();
      setSourceText(fullText || defaultContextText);
      setIsUsingFullContext(Boolean(fullText.trim()));
      setIsAiOpen(false);
    });
  }, [activeEditor, defaultContextText]);

  const systemPrompt = useMemo(
    () => t('ed.quizPromptSystem'),
    [t],
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

  function normalizeTests(payload: unknown, expectedCount: number): Test[] {
    if (!Array.isArray(payload)) {
      throw new Error(t('ed.quizErrorModelNotArray'));
    }
    if (payload.length !== expectedCount) {
      throw new Error(formatMessage('ed.quizErrorModelExactCount', {count: expectedCount}));
    }

    return payload.map((item, idx) => {
      if (!item || typeof item !== "object") {
        throw new Error(formatMessage('ed.quizErrorInvalidQuestionFormat', {index: idx + 1}));
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
        throw new Error(formatMessage('ed.quizErrorMissingQuestionContent', {index: idx + 1}));
      }
      if (answers.length !== 4 || answers.some((a) => !a)) {
        throw new Error(formatMessage('ed.quizErrorQuestionNeedsFourAnswers', {index: idx + 1}));
      }
      if (correctAnswerIndex === null || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
        throw new Error(formatMessage('ed.quizErrorInvalidCorrectIndex', {index: idx + 1}));
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
      toast.error(t('ed.provideSource'));
      return;
    }

    setIsGenerating(true);
    try {
      const requestedCount = Number.isFinite(aiQuestionCount)
        ? Math.max(1, Math.min(aiQuestionCount, 20))
        : 5;
      const userPrompt = formatMessage('ed.quizPromptUser', {
        count: requestedCount,
        courseName: module?.courseName ?? t('ed.quizMissingValue'),
        moduleName: module?.moduleName ?? t('ed.quizMissingValue'),
        sourceText: hasText
          ? text
          : t('ed.quizNoSourceTextFallback'),
      });

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
      const generatedTests = normalizeTests(parsed, requestedCount);

      activeEditor.dispatchCommand(INSERT_TEST_COMMAND, {
        tests: generatedTests,
      });
      toast.success(formatMessage('ed.quizGeneratedAndInserted', {count: requestedCount}));
      onClose();
    } catch (err) {
      console.error("Quiz AI generation error:", err);
      toast.error(t('ed.quizGenerateFailed'));
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
            <div className="font-semibold text-gray-900">{t('ed.quizAiTitle')}</div>
            <div className="text-xs font-semibold text-orange-700">
              {isAiOpen ? t('ed.hide') : t('ed.expand')}
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {sourceText.trim()
              ? t('ed.quizAiHintHasSource')
              : module?.courseName || module?.moduleName
                ? t('ed.quizAiHintNoSelectionWithContext')
                : t('ed.quizAiHintSelectTextBest')}
          </div>
        </button>

        {isAiOpen ? (
          <>
            <div className="text-xs text-gray-500">
              {t('ed.quizAiInfo')}
            </div>
            <Textarea
              value={sourceText}
              onChange={(e) => {
                setSourceText(e.target.value);
                setIsUsingFullContext(false);
              }}
              placeholder={
                module?.courseName || module?.moduleName
                  ? t('ed.quizSourcePlaceholderWithContext')
                  : t('ed.quizSourcePlaceholderNoContext')
              }
              className="min-h-[120px]"
              disabled={isGenerating}
            />
            {isUsingFullContext && !sourceText.trim() && (
              <div className="text-xs text-gray-500">
                {t('ed.noTextCtx')}
              </div>
            )}
            {isUsingFullContext && sourceText.trim() && (
              <div className="text-xs text-gray-500">
                {t('ed.noSelectionCtx')}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-gray-700">
                {t('ed.questionCount')}
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
                {t('ed.loadSelection')}
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
                    {t('ed.generating')}
                  </>
                ) : (
                  `${t('ed.generate')} ${Number.isFinite(aiQuestionCount)
                    ? Math.max(1, Math.min(aiQuestionCount, 20))
                    : 5}`
                )}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <hr className="border-gray-200" />
      <div className="mb-2 text-lg font-bold text-orange-700">{`${t('ed.quizQuestion')} ${step + 1}`}</div>
      <div className="grid grid-cols-2 gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">{t('ed.quizAskQuestion')}</label>
        <textarea
          value={current.question}
          onChange={(e) => setCurrent((prev) => ({ ...prev, question: e.target.value }))}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder={t('ed.quizQuestionPlaceholder')}
          rows={3}
        />

        {current.answers.map((answer, index) => (
          <React.Fragment key={index}>
            <label className="text-sm font-medium text-gray-700">
              {t('ed.quizAnswer')} {String.fromCharCode(65 + index)}
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => onAnswerChange(index, e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder={`${t('ed.quizAnswer')} ${String.fromCharCode(65 + index)}`}
            />
          </React.Fragment>
        ))}

        <label className="text-sm font-medium text-gray-700">
          {t('ed.quizCorrectAnswer')}
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
            {t('ed.quizSelectCorrect')}
          </option>
          {current.answers.map((_, index) => (
            <option key={index} value={index}>
              {String.fromCharCode(65 + index)}
            </option>
          ))}
        </select>

        <label className="text-sm font-medium text-gray-700">
          {t('ed.quizDescOpt')}
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
          placeholder={t('ed.quizDescPlaceholder')}
        />
      </div>

      <div className="flex justify-between space-x-4 mt-4">
        <button
          onClick={handleAddQuestion}
          disabled={!isFormValid}
          className={`px-4 py-2 rounded-md text-white ${isFormValid ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-400"
            }`}
        >
          {t('ed.quizAddQuestion')}
        </button>
        <button
          onClick={handleFinish}
          // Utwórz quiz dostępny, gdy istnieje przynajmniej jedno kompletne pytanie
          disabled={!canFinish}
          className={`px-4 py-2 rounded-md text-white ${canFinish ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
            }`}
        >
          {t('ed.quizFinish')}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          {t('ed.cancel')}
        </button>
      </div>
      {tests.length > 0 && (
        <div className="mt-4">
          <div className="font-semibold mb-2">{t('ed.addedQuestions')}</div>
          <ul className="list-decimal list-inside space-y-1">
            {tests.map((q, idx) => (
              <li key={idx} className="text-sm">{q.question}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
