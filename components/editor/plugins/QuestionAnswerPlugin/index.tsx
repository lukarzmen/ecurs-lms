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
import { $createQuestionAnswerNode } from '../../nodes/QuestionAnswerNode/QuestionAnswer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export const INSERT_QA_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_QA_COMMAND'
);

export function QuestionAnswerDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [question, setQuestion] = useState('');

  const handleOnClick = () => {
    activeEditor.dispatchCommand(INSERT_QA_COMMAND, question);
    onClose();
  };

  return (
    <div className="p-4 space-y-4">
      <label className="block text-sm font-medium text-gray-700">Question</label>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-2"
      />
      <div className="flex justify-end space-x-4">
        <button
          disabled={question.trim() === ''}
          onClick={handleOnClick}
          className={`px-4 py-2 rounded-md text-white ${
            question.trim() === ''
              ? 'bg-gray-400'
              : 'bg-blue-600 hover:bg-blue-700'
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

export default function QuestionAnswerPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<string>(
      INSERT_QA_COMMAND,
      (payload) => {
        const qaNode = $createQuestionAnswerNode(payload);
        editor.update(() => {
          $insertNodes([qaNode]);
          if ($isRootOrShadowRoot(qaNode.getParentOrThrow())) {
            $wrapNodeInElement(qaNode, $createParagraphNode).selectEnd();
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
