import { LexicalEditor } from "lexical";
import React, { useState } from "react";
import { INSERT_TEST_COMMAND } from ".";

export function InsertQuizDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(
    null
  );
  const [correctAnswerDescription, setCorrectAnswerDescription] = useState<
    string | null
  >(null);

  const onAnswerChange = (index: number, value: string) => {
    setAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[index] = value;
      return updatedAnswers;
    });
  };

  const isFormValid =
    question.trim() !== "" &&
    answers.every((answer) => answer !== "") &&
    correctAnswerIndex !== null;

  const onClick = () => {
    if (isFormValid) {
      activeEditor.dispatchCommand(INSERT_TEST_COMMAND, {
        question: question.trim(),
        answers: answers.map((a) => a.trim()),
        correctAnswerIndex,
        correctAnswerDescription: correctAnswerDescription?.trim() || null,
      });
      onClose();
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Zadaj pytanie</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Wpisz swoje pytanie"
          rows={3} // Optional: Set the initial number of rows
        />

        {answers.map((answer, index) => (
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
          value={correctAnswerIndex !== null ? correctAnswerIndex.toString() : ""}
          onChange={(e) =>
            setCorrectAnswerIndex(e.target.value ? parseInt(e.target.value, 10) : null)
          }
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        >
          <option value="" disabled>
            Wybierz poprawną odpowiedź
          </option>
          {answers.map((_, index) => (
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
          value={correctAnswerDescription || ""}
          onChange={(e) => setCorrectAnswerDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Dodatkowe szczegóły dotyczące poprawnej odpowiedzi (opcjonalnie)"
        />
      </div>

      <div className="flex justify-end space-x-4 mt-4">
        <button
          onClick={onClick}
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
