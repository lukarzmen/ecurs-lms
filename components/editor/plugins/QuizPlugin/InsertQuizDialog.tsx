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
      updatedAnswers[index] = value.trim();
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
        <label className="text-sm font-medium text-gray-700">Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Enter your question"
        />

        {answers.map((answer, index) => (
          <React.Fragment key={index}>
            <label className="text-sm font-medium text-gray-700">
              Answer {String.fromCharCode(65 + index)}
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => onAnswerChange(index, e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder={`Answer ${String.fromCharCode(65 + index)}`}
            />
          </React.Fragment>
        ))}

        <label className="text-sm font-medium text-gray-700">
          Correct Answer
        </label>
        <select
          value={correctAnswerIndex !== null ? correctAnswerIndex.toString() : ""}
          onChange={(e) =>
            setCorrectAnswerIndex(e.target.value ? parseInt(e.target.value, 10) : null)
          }
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="" disabled>
            Select correct answer
          </option>
          {answers.map((_, index) => (
            <option key={index} value={index}>
              {String.fromCharCode(65 + index)}
            </option>
          ))}
        </select>

        <label className="text-sm font-medium text-gray-700">
          Answer Description (Optional)
        </label>
        <input
          type="text"
          value={correctAnswerDescription || ""}
          onChange={(e) => setCorrectAnswerDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Additional details about the correct answer (optional)"
        />
      </div>

      <div className="flex justify-end space-x-4 mt-4">
        <button
          onClick={onClick}
          disabled={!isFormValid}
          className={`px-4 py-2 rounded-md text-white ${isFormValid ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
            }`}
        >
          Confirm
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
