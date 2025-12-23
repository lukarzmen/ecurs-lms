import { LexicalEditor } from "lexical";
import React, { useState } from "react";
import { Test } from "../../nodes/QuizNode/QuizComponent";
import { INSERT_TEST_COMMAND } from ".";


export function InsertQuizDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [tests, setTests] = useState<Test[]>([]);
  const [current, setCurrent] = useState<Test>({
    question: "",
    answers: ["", "", "", ""],
    correctAnswerIndex: null,
    correctAnswerDescription: null,
  });
  const [step, setStep] = useState(0);

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
          // Utwórz quiz dostępny tylko gdy formularz aktualnego pytania jest wypełniony
          disabled={!isFormValid}
          className={`px-4 py-2 rounded-md text-white ${isFormValid ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
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
