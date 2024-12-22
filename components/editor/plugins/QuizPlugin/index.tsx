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

import {
  $createQuizNode,
  createQuizOption,
  QuizNode,
} from '../../nodes/QuizNode';
import Button from '../../ui/Button';
import {DialogActions} from '../../ui/Dialog';
import TextInput from '../../ui/TextInput';

export const INSERT_TEST_COMMAND: LexicalCommand<string> = createCommand(
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

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_TEST_COMMAND, question);
    onClose();
  };

  return (
    <>
      <TextInput label="Question" onChange={setQuestion} value={question} />
      <DialogActions>
        <Button disabled={question.trim() === ''} onClick={onClick}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export default function TestPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([QuizNode])) {
      throw new Error('QuizPlugin: QuizNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_TEST_COMMAND,
      (payload) => {
        const testNode = $createQuizNode(payload, [
          createQuizOption(),
          createQuizOption(),
        ]);
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