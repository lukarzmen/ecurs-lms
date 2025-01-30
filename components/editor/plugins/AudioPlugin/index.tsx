import React, { useState, useEffect, useRef } from "react";
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
import ProgressSpinner from "../TextGeneratorPlugin/ProgressComponent";

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
  const [generateTranscription, setGenerateTranscription] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`File upload error: ${errorData.message}`);
      }

      const data = await response.json();
      setAudioUrl(`${window.location.origin}/api/audio/${data.id}`);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

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

        const data = await response.json();
        generatedTranscription = data.transcription;
      }
      console.log("Dispatching CREATE_AUDIO_NODE_COMMAND:", audioUrl, generatedTranscription);
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
  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        const newFile = new File([audioBlob], "recording.mp3", { type: "audio/mp3" });
        setFile(newFile);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-4">Generate Audio Transcription</h2>
        <label className="block text-sm font-medium text-gray-700 mb-2">Audio Source</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter audio source URL..."
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          disabled={isRecording || loading}
        />
        <div className="flex flex-col space-y-2 mb-4">
          {loading ? (
            <div className="flex justify-center items-center">
              <span className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-500 rounded-full"></span>
            </div>
          ) : (
            <>
              <button
                className={`px-4 py-2 ${isRecording ? "bg-red-500" : "bg-green-500"} text-white rounded-md`}
                onClick={handleRecord}
                disabled={!!audioUrl || loading}
              >
                {isRecording ? "Stop Recording" : "Record Audio"}
              </button>
              <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md">
                <input
                  type="file"
                  accept="audio/mp3"
                  className="w-full"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={isRecording || loading}
                />

              </div>
                <button
                  className={`px-4 py-2 rounded-md text-white ${!file || loading ? "bg-gray-500" : "bg-blue-500"}`}
                  onClick={handleUpload}
                  disabled={!file || loading}
                >
                  Upload
                </button>
            </>
          )}
        </div>
        
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            className="mr-2"
            checked={generateTranscription}
            onChange={(e) => setGenerateTranscription(e.target.checked)}
            disabled={loading}
          />
          <span className="text-sm">Generate Transcription</span>
        </div>

        <div className="flex justify-end space-x-2">
          {loading ? (
            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md" disabled>
              Processing...
            </button>
          ) : (
            <>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                onClick={onClose}
              >
                Cancel
              </button>
              {audioUrl.trim() && (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  Confirm
                </button>
              )}
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
    return editor.registerCommand<{ audioSrc: string; transcription?: string }>(
      CREATE_AUDIO_NODE_COMMAND,
      ({ audioSrc, transcription }) => {
        editor.update(() => {
          console.log("Creating audio node with src:"), audioSrc, transcription;
          const root = $getRoot();
          const audioNode = new AudioNode(audioSrc);
          const paragraphNode = $createParagraphNode();

          root.append(paragraphNode, audioNode);

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
