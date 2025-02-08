import { LexicalEditor } from "lexical";
import React, { useState } from "react";
import { INSERT_SELECT_ANSWER_NODE_COMMAND } from ".";

export function InsertSelectAnswerDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [answers, setAnswers] = useState<string[]>([""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(
    null
  );

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
    setAnswers((prevAnswers) =>
      prevAnswers.filter((_, i) => i !== index)
    );
    if (correctAnswerIndex !== null && correctAnswerIndex >= index) {
      setCorrectAnswerIndex(
        (prevIndex) => (prevIndex !== null ? prevIndex - 1 : null)
      );
    }
  };

  const isFormValid =
    answers.every((answer) => answer.trim() !== "") &&
    correctAnswerIndex !== null;

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
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="grid grid-cols-2 gap-4 items-center">
        
        {answers.map((answer, index) => (
          <React.Fragment key={index}>
            <label className="text-sm font-medium text-gray-700">
              Answer {String.fromCharCode(65 + index)}
            </label>
            <div className="flex space-x-2 items-center">
              <input
                type="text"
                value={answer}
                onChange={(e) => onAnswerChange(index, e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder={`Answer ${String.fromCharCode(65 + index)}`}
              />
              <button
                type="button"
                onClick={() => removeAnswer(index)}
                className="bg-red-500 text-white rounded-md p-2"
              >
                X
              </button>
            </div>
          </React.Fragment>
        ))}

        <button
          type="button"
          onClick={addAnswer}
          className="col-span-2 bg-green-500 text-white rounded-md p-2"
        >
          Add Answer
        </button>

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
      </div>

      <div className="flex justify-end space-x-4 mt-4">
        <button
          onClick={submitSelectAnswer}
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
