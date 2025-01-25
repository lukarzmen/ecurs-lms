import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  createCommand,
  LexicalCommand,
  COMMAND_PRIORITY_EDITOR,
  LexicalEditor,
} from 'lexical';
import { useState, useEffect } from 'react';
import * as React from 'react';
import ProgressSpinner from '../TextGeneratorPlugin/ProgressComponent';

export const TRANSLATE_TEXT_COMMAND: LexicalCommand<LLMPrompt> = createCommand('TRANSLATE_TEXT_COMMAND');

export function LanguageSelectorDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [selectedLanguage, setSelectedLanguage] = useState('polish');
  const [loading, setLoading] = useState(false);

  const handleTranslate = () => {
    activeEditor.read(() => {
      const selection = $getSelection();
  
      if ($isRangeSelection(selection)) {
        const selectedText = selection.getTextContent();
  
        if (selectedText.trim()) {
          setLoading(true);
          activeEditor.dispatchCommand(TRANSLATE_TEXT_COMMAND, {
            userPrompt: selectedText,
            systemPrompt: `translate to ${selectedLanguage}`,
          });
        } else {
          console.warn('No text selected for translation.');
        }
      } else {
        console.warn('No valid text selection.');
      }
    });
  };

  useEffect(() => {
    if (!loading) return;

    const handleTranslationComplete = () => {
      setLoading(false);
      onClose();
    };

    document.addEventListener('translationComplete', handleTranslationComplete);

    return () => {
      document.removeEventListener('translationComplete', handleTranslationComplete);
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
        <h2 className="text-xl font-bold mb-4">Translate Text</h2>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Language
        </label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="polish">Polish</option>
          <option value="english">English</option>
          <option value="russian">Russian</option>
        </select>
        <div className="flex justify-end space-x-2">
          {loading ? (
            <ProgressSpinner />
          ) : (
            <>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={handleTranslate}
              >
                Translate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TranslationPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<LLMPrompt>(
      TRANSLATE_TEXT_COMMAND,
      (payload) => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const selectedText = selection.getTextContent();

          fetch(`/api/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
            .then((response) => response.text())
            .then((data) => {
              editor.update(() => {
                if ($isRangeSelection(selection)) {
                  selection.insertText(data);
                }
              });

              const event = new Event('translationComplete');
              document.dispatchEvent(event);
            })
            .catch((error) => console.error('Translation failed:', error));
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}