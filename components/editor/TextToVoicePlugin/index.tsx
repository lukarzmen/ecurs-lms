import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand, LexicalEditor } from "lexical";
import { useEffect, useState } from "react";
import { CREATE_AUDIO_NODE_COMMAND } from "../plugins/AudioPlugin";
import ProgressSpinner from "../plugins/TextGeneratorPlugin/ProgressComponent";
import toast from "react-hot-toast";

export const TEXT_TO_VOICE_COMMAND = createCommand(
  "TEXT_TO_VOICE_COMMAND"
);

export function TextToVoiceDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [selectedLanguage, setSelectedLanguage] = useState('russian');
  const [loading, setLoading] = useState(false);

  const handleTextToVoice = () => {
    activeEditor.read(async () => {
      const selection = $getSelection();
  
      if ($isRangeSelection(selection)) {
        const selectedText = selection.getTextContent();
  
        if (selectedText.trim()) {
          setLoading(true);
            try {
            const response = await fetch("/api/audio/generate", {
              method: "POST",
              body: JSON.stringify({ text: selectedText }),
            });
          
            if (!response.ok) {
              setLoading(false);
              throw new Error("File upload failed");
            }
          
            const data = await response.json();
        
            activeEditor.dispatchCommand(CREATE_AUDIO_NODE_COMMAND, {
              audioSrc: `${window.location.origin}/api/audio/${data.id}`,
              transcription: undefined,
            });
            onClose();
            } catch (error) {
            console.error("Error generating voice:", error);
            } finally {
              setLoading(false);
            }
        } else {
          toast.error('No text selected for create voice.');
        }
      } else {
        toast.error('No valid text selection.');
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
        <h2 className="text-xl font-bold mb-4 text-center">Change text to voice</h2>
        
        <div className="flex justify-center space-x-2 mt-8">
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
                onClick={handleTextToVoice}>
                Generate voice
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}