import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$wrapNodeInElement} from '@lexical/utils';
import {
  $createParagraphNode,
  $getSelection,
  $getTextContent,
  $insertNodes,
  $isRangeSelection,
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

export function ToDictionaryDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [question, setQuestion] = useState('');
  const [text, setText] = useState('');
  
  useEffect(() => {
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection();
      if (selection && $isRangeSelection(selection)) {
        const selectedText = selection.getTextContent();
        setText(selectedText);
      }
    });
  }, [text]);
  
  const onClick = () => {
    onClose();
  };

  return (
    <>
      <TextInput label="Dictionary" onChange={setQuestion} value={text} />
      <DialogActions>
        <Button disabled={question.trim() === ''} onClick={onClick}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}