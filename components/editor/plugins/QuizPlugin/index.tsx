import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement } from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import { useEffect, useState } from 'react';
import * as React from 'react';

import { QuizNode } from '../../nodes/QuizNode/QuizNode';

export const INSERT_TEST_COMMAND: LexicalCommand<{
  question: string;
  answers: string[];
  correctAnswerIndex: number;
  correctAnswerDescription: string | null;
}> = createCommand('INSERT_TEST_COMMAND');

export function InsertQuizDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
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
    question.trim() !== '' &&
    answers.every((answer) => answer.trim() !== '') &&
    correctAnswerIndex !== null;

  const onClick = () => {
    if (isFormValid) {
      activeEditor.dispatchCommand(INSERT_TEST_COMMAND, {
        question,
        answers,
        correctAnswerIndex,
        correctAnswerDescription,
      });
      onClose();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Question
      </label>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-2"
      />
      {answers.map((answer, index) => (
        <div key={index}>
          <label className="block text-sm font-medium text-gray-700">
            {String.fromCharCode(65 + index)}
          </label>
          <input
            type="text"
            value={answer}
            onChange={(e) => onAnswerChange(index, e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
      ))}
      <label className="block text-sm font-medium text-gray-700">Correct</label>
      <select
        value={correctAnswerIndex?.toString() || ''}
        onChange={(e) =>
          setCorrectAnswerIndex(parseInt(e.target.value, 10))
        }
        className="w-full border border-gray-300 rounded-md p-2"
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
      <label className="block text-sm font-medium text-gray-700">
        Answer description (optional)
      </label>
      <input
        type="text"
        value={correctAnswerDescription || ''}
        onChange={(e) => setCorrectAnswerDescription(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-2"
      />
      <div className="flex justify-end space-x-4">
        <button
          disabled={!isFormValid}
          onClick={onClick}
          className={`px-4 py-2 rounded-md text-white ${
            isFormValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
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

export default function TestPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand<any>(
      INSERT_TEST_COMMAND,
      ({
        question,
        answers,
        correctAnswerIndex,
        correctAnswerDescription,
      }) => {
        const testNode = new QuizNode(
          question,
          answers,
          correctAnswerIndex,
          correctAnswerDescription
        );
        $insertNodes([testNode]);
        if ($isRootOrShadowRoot(testNode.getParentOrThrow())) {
          $wrapNodeInElement(testNode, $createParagraphNode).selectEnd();
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}
