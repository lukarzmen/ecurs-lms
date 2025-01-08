import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$wrapNodeInElement} from '@lexical/utils';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
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
import OpenAIService from '@/services/OpenAIService';

export const GENERATE_TEXT_COMMAND: LexicalCommand<string> = createCommand(
  'GENERATE_TEXT_COMMAND',
);

export function TextGeneratorDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [question, setQuestion] = useState('');

  const onClick = () => {
    activeEditor.dispatchCommand(GENERATE_TEXT_COMMAND, question);
    onClose();
  };

  return (
    <>
      <TextInput label="What do you want to generate?" onChange={setQuestion} value={question} />
      <DialogActions>
        <Button disabled={question.trim() === ''} onClick={onClick}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export default function TextGeneratorPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const openAiService = new OpenAIService();

  useEffect(() => {
    return editor.registerCommand<string>(
      GENERATE_TEXT_COMMAND,
      (payload) => {
        openAiService
          .askOpenAi(payload)
          .then((response) => {
            editor.update(() => {
              const root = $getRoot();
              root.clear();
              const text = $createTextNode(response);
              root.append($createParagraphNode().append(text));
              text.select();
            });
          });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
