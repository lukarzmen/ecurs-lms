import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$wrapNodeInElement} from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import {useEffect, useState} from 'react';
import * as React from 'react';

import Button from '../../ui/Button';
import {DialogActions} from '../../ui/Dialog';
import TextInput from '../../ui/TextInput';
import Select from '../../ui/Select';
import { QuizNode } from '../../nodes/QuizNode/QuizNode';

export const INSERT_TEST_COMMAND: LexicalCommand<{question: string; answers: string[]; correctAnswerIndex: number}> = createCommand(
  'INSERT_TEST_COMMAND',
);

export function InsertQuizDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);

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
      });
      onClose();
    }
  };

  return (
    <>
      <TextInput label="Question" onChange={setQuestion} value={question} />
      {answers && answers.map((answer, index) => (
        <TextInput
          key={index}
          label={`Answer ${index + 1}`}
          onChange={(value) => onAnswerChange(index, value)}
          value={answer}
        />
      ))}
      <Select
        label="Correct Answer"
        value={correctAnswerIndex?.toString() || ''}
        onChange={(event) => setCorrectAnswerIndex(parseInt(event.target.value, 10))}
      >
        <option value="" disabled>
          Select correct answer
        </option>
        {answers && answers.map((_, index) => (
          <option key={index} value={index}>
            Answer {index + 1}
          </option>
        ))}
      </Select>
      <DialogActions>
        <Button disabled={!isFormValid} onClick={onClick}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}


export default function TestPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand<any>(
      INSERT_TEST_COMMAND,
      ({question, answers, correctAnswerIndex}) => {
        const testNode = new QuizNode(question, answers, correctAnswerIndex);
        $insertNodes([testNode]);
        if ($isRootOrShadowRoot(testNode.getParentOrThrow())) {
          $wrapNodeInElement(testNode, $createParagraphNode).selectEnd();
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);
  return null;
}
