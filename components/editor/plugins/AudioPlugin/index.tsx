import React, { useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from "lexical";
import { AudioNode } from "../../nodes/AudioNode";

export const CREATE_AUDIO_NODE_COMMAND: LexicalCommand<{ audioSrc: string; transcription?: string }> = createCommand(
  "CREATE_AUDIO_NODE_COMMAND"
);

export function TranscriptionDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [generateTranscription, setGenerateTranscription] = useState(false); // New state for the checkbox
  const [transcription, setTranscription] = useState<string | null>(null); // State to hold transcription

  const handleGenerate = async () => {
    if (!audioUrl.trim()) {
      return;
    }

    setLoading(true);

    try {
      let generatedTranscription = "";
      if (generateTranscription) {
        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: audioUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Server error: ${response.status} - ${errorData.message}`);
        }

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        generatedTranscription = data.transcription;
      }

      // Dispatch the command to insert audio node (and transcription if needed)
      activeEditor.dispatchCommand(CREATE_AUDIO_NODE_COMMAND, {
        audioSrc: audioUrl,
        transcription: generateTranscription ? generatedTranscription : undefined,
      });

      onClose();
    } catch (error) {
      console.error("Error during transcription:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Generate Audio Transcription</h2>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Audio URL
        </label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter audio source URL..."
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
        />
        
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            className="mr-2"
            checked={generateTranscription}
            onChange={(e) => setGenerateTranscription(e.target.checked)}
          />
          <span className="text-sm">Generate Transcription</span>
        </div>

        <div className="flex justify-end space-x-2">
          {loading ? (
            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md" disabled>
              Generating...
            </button>
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
                onClick={handleGenerate}
              >
                Confirm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AudioPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register the command for creating an audio node
    return editor.registerCommand<{ audioSrc: string; transcription?: string }>(
      CREATE_AUDIO_NODE_COMMAND,
      ({ audioSrc, transcription }) => {
        editor.update(() => {
          const root = $getRoot();
          const audioNode = new AudioNode(audioSrc);
          const paragraphNode = $createParagraphNode();

          root.append(paragraphNode, audioNode); // Insert audio node

          // If transcription is provided, add transcription node
          if (transcription) {
            const transcriptionNode = $createParagraphNode();
            transcriptionNode.append($createTextNode(transcription));
            root.append(transcriptionNode);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
