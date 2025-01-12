import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import { useEffect, useState } from 'react';
import * as React from 'react';

import OpenAIService from '@/services/OpenAIService';
import ProgressSpinner from './ProgressComponent';

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
  const [loading, setLoading] = useState(false);

  const onClick = () => {
    console.log('Generating text:', question);
    setLoading(true);
    activeEditor.dispatchCommand(GENERATE_TEXT_COMMAND, question);
  };

  useEffect(() => {
    if (!loading) return;
    const handleLoadingComplete = () => {
      setLoading(false);
      onClose();
    };

    // Listen for a custom event to signal loading is complete
    document.addEventListener('generateTextComplete', handleLoadingComplete);

    return () => {
      document.removeEventListener(
        'generateTextComplete',
        handleLoadingComplete,
      );
    };
  }, [loading, onClose]);

  return (
    <div className="p-4 space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        What do you want to generate?
      </label>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-2"
      />
      <div className="flex justify-end space-x-4">
        {loading ? (
          <div className="flex items-center">
              <ProgressSpinner />
          </div>
        ) : (
          <>
            <button
              disabled={question.trim() === ''}
              onClick={onClick}
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
          </>
        )}
      </div>
    </div>
  );
}

export default function TextGeneratorPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const openAiService = new OpenAIService();

  useEffect(() => {
    return editor.registerCommand<string>(
      GENERATE_TEXT_COMMAND,
      (payload) => {
        console.log('Generating text:', payload);
        fetch('/api/tasks?prompt=' + encodeURIComponent(payload), {
          method: 'GET',
        })
          .then((response) => response.text())
          .then((response) => {
            editor.update(() => {
              const root = $getRoot();
              const textNode = $createTextNode(response);
              if (root.getLastChild() && $isParagraphNode(root.getLastChild())) {
                const lastChild = root.getLastChild();
                if (lastChild && $isParagraphNode(lastChild)) {
                  lastChild.append(textNode);
                }
              } else {
                // Utwórz nowy węzeł paragrafu, jeśli nie istnieje
                const paragraphNode = $createParagraphNode();
                paragraphNode.append(textNode);
                root.append(paragraphNode);
              }
            });

            // Dispatch custom event to signal completion
            const event = new Event('generateTextComplete');
            document.dispatchEvent(event);
          });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
