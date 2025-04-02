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
import toast from 'react-hot-toast';

export const GENERATE_TEXT_COMMAND: LexicalCommand<LLMPrompt> = createCommand(
  'GENERATE_TEXT_COMMAND',
);

export function TextGeneratorDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [userPrompt, setUserPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("Nie dodawaj do tekstu znaczników jak ### ani znaków specjalnych ** i tym podobnych. Sam tekst bez formatowania znakami.");
  const [isSystemPromptEditable, setIsSystemPromptEditable] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (userPrompt.trim()) {
      const payload: LLMPrompt = { userPrompt: userPrompt.trim(), systemPrompt: systemPrompt.trim() };
      setLoading(true);
      activeEditor.dispatchCommand(GENERATE_TEXT_COMMAND, payload);
    } else {
      toast.error("Polecenie użytkownika nie może być puste.");
    }
  };

  useEffect(() => {
    if (!loading) return;
    const handleLoadingComplete = () => {
      setLoading(false);
      onClose();
    };

    // Listen for a custom event to signal loading is complete
    document.addEventListener("generateTextComplete", handleLoadingComplete);

    return () => {
      document.removeEventListener(
        "generateTextComplete",
        handleLoadingComplete
      );
    };
  }, [loading, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Generator treść</h2>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Co chcesz wygenerować?
        </label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          rows={4}
          placeholder="Wpisz swoje polecenie..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
        />
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Informacje systemowe (kontekstowe) dla AI
        </label>
        <div className="relative">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            rows={3}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            disabled={!isSystemPromptEditable}
          />
          <button
            className="absolute top-1 right-2 text-gray-500 hover:text-gray-700"
            onClick={() => setIsSystemPromptEditable(!isSystemPromptEditable)}
          >
            ✎
          </button>
        </div>
        <div className="flex justify-end space-x-2">
          {loading ? (
            <div className="flex items-center">
              <ProgressSpinner />
            </div>
          ) : (
            <>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                onClick={onClose}
              >
                Anuluj
              </button>
              <button
                className="px-4 py-2 bg-orange-500 text-white rounded-md"
                onClick={handleSubmit}
                disabled={userPrompt.trim() === ""}
              >
                Generuj
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TextGeneratorPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<LLMPrompt>(
      GENERATE_TEXT_COMMAND,
      (payload) => {
          fetch('/api/tasks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
          .then((response) => response.text())
          .then((response) => {
            editor.update(() => {
              const root = $getRoot();
              const lines = response.split('\n');
              lines.forEach((line) => {
                const paragraphNode = $createParagraphNode();
                const textNode = $createTextNode(line);
                paragraphNode.append(textNode);
                root.append(paragraphNode);
              });
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
