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
  const [uploadType, setUploadType] = useState<"url" | "record" | "file" | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [recordingUrl, setRecordingAudioUrl] = useState("");
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
        throw new Error("File upload failed");
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
    if (!audioUrl.trim()) return;
    setLoading(true);
    
    try {
      let generatedTranscription = "";
      if (generateTranscription) {
        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: audioUrl }),
        });
        
        if (!response.ok) throw new Error("Transcription failed");
        const data = await response.json();
        generatedTranscription = data.transcription;
      }

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
        setRecordingAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const handleUploadRecorded = async () => {
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
        throw new Error("File upload failed");
      }

      const data = await response.json();
      setAudioUrl(`${window.location.origin}/api/audio/${data.id}`);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-4">Choose Upload Type</h2>
        <div className="flex flex-col space-y-2 mb-4">
          <button className="px-4 py-2 bg-orange-500 text-white rounded-md" onClick={() => setUploadType("url")}>
            Enter Source URL
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-md" onClick={() => setUploadType("record")}>
            Record Audio
          </button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded-md" onClick={() => setUploadType("file")}>
            Upload File
          </button>
        </div>
        {uploadType === "url" && (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            placeholder="Enter audio source URL..."
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
          />
        )}
        {uploadType === "record" && (
          <>
            <button className={`px-4 py-2 ${isRecording ? "bg-red-500" : "bg-green-500"} text-white rounded-md`} onClick={handleRecord}>
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
            {recordingUrl && (
              <div className="mt-4">
                <audio controls>
                  <source src={recordingUrl} type="audio/mp3" />
                  Your browser does not support the audio tag.
                </audio>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-md mt-2" onClick={handleUploadRecorded} disabled={loading}>
                  {loading ? "Uploading..." : "Upload Recording"}
                </button>
              </div>
            )}
          </>
        )}
        {uploadType === "file" && (
          <>
            <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button className="px-4 py-2 bg-orange-500 text-white rounded-md mt-2" onClick={handleUpload} disabled={!file || loading}>
              {loading ? "Uploading..." : "Upload File"}
            </button>
            {file && (
              <audio controls className="mt-4">
                <source src={URL.createObjectURL(file)} type="audio/mp3" />
                Your browser does not support the audio tag.
              </audio>
            )}
          </>
        )}
        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            id="generateTranscription"
            checked={generateTranscription}
            onChange={() => setGenerateTranscription(!generateTranscription)}
            className="mr-2"
          />
          <label htmlFor="generateTranscription" className="text-gray-800">Generate Transcription</label>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md" onClick={onClose}>Cancel</button>
          {(audioUrl && !loading) ? (
            <button className="px-4 py-2 bg-orange-500 text-white rounded-md" onClick={handleGenerate}>
              Confirm
            </button>
          ) : null}
        </div>
        {loading && <ProgressSpinner />}
      </div>
    </div>
  );}

export default function AudioPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    return editor.registerCommand<{ audioSrc: string; transcription?: string }>(
      CREATE_AUDIO_NODE_COMMAND,
      ({ audioSrc, transcription }) => {
        editor.update(() => {
          const root = $getRoot();
          if(!root.getChildren()){
            root.append($createParagraphNode());
          }
          const audioNode = new AudioNode(audioSrc);
          const paragraphNode = $createParagraphNode();

          root.append(paragraphNode, audioNode);

          if (transcription) {
            const transcriptionNode = $createParagraphNode();
            transcriptionNode.append($createTextNode(transcription));
            root.append(transcriptionNode);
            root.append($createParagraphNode());
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
