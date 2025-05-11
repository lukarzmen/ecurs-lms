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
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  $isParagraphNode,
  ParagraphNode, 
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
        throw new Error("Przesyłanie pliku nie powiodło się");
      }

      const data = await response.json();
      setAudioUrl(`${window.location.origin}/api/audio/${data.id}`);
    } catch (error) {
      console.error("Błąd podczas przesyłania pliku:", error);
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
        
        if (!response.ok) throw new Error("Transkrypcja nie powiodła się");
        const data = await response.json();
        generatedTranscription = data.transcription;
      }

      activeEditor.dispatchCommand(CREATE_AUDIO_NODE_COMMAND, {
        audioSrc: audioUrl,
        transcription: generateTranscription ? generatedTranscription : undefined,
      });

      onClose();
    } catch (error) {
      console.error("Błąd podczas transkrypcji:", error);
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
      console.error("Błąd podczas uzyskiwania dostępu do mikrofonu:", error);
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
        throw new Error("Przesyłanie pliku nie powiodło się");
      }

      const data = await response.json();
      setAudioUrl(`${window.location.origin}/api/audio/${data.id}`);
    } catch (error) {
      console.error("Błąd podczas przesyłania pliku:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-4">Wybierz sposób przesyłania</h2>
        <div className="flex flex-col space-y-2 mb-4">
          <button className="px-4 py-2 bg-orange-500 text-white rounded-md" onClick={() => setUploadType("url")}>
            Wprowadź URL źródła
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-md" onClick={() => setUploadType("record")}>
            Nagraj dźwięk
          </button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded-md" onClick={() => setUploadType("file")}>
            Prześlij plik
          </button>
        </div>
        {uploadType === "url" && (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            placeholder="Wprowadź URL źródła audio..."
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
          />
        )}
        {uploadType === "record" && (
          <>
            <button className={`px-4 py-2 ${isRecording ? "bg-red-500" : "bg-green-500"} text-white rounded-md`} onClick={handleRecord}>
              {isRecording ? "Zatrzymaj nagrywanie" : "Rozpocznij nagrywanie"}
            </button>
            {recordingUrl && (
              <div className="mt-4">
                <audio controls>
                  <source src={recordingUrl} type="audio/mp3" />
                  Twoja przeglądarka nie obsługuje tagu audio.
                </audio>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-md mt-2" onClick={handleUploadRecorded} disabled={loading}>
                  {loading ? "Przesyłanie..." : "Prześlij nagranie"}
                </button>
              </div>
            )}
          </>
        )}
        {uploadType === "file" && (
          <>
            <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button className="px-4 py-2 bg-orange-500 text-white rounded-md mt-2" onClick={handleUpload} disabled={!file || loading}>
              {loading ? "Przesyłanie..." : "Prześlij plik"}
            </button>
            {file && (
              <audio controls className="mt-4">
                <source src={URL.createObjectURL(file)} type="audio/mp3" />
                Twoja przeglądarka nie obsługuje tagu audio.
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
          <label htmlFor="generateTranscription" className="text-gray-800">Generuj transkrypcję</label>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md" onClick={onClose}>Anuluj</button>
          {(audioUrl && !loading) ? (
            <button className="px-4 py-2 bg-orange-500 text-white rounded-md" onClick={handleGenerate}>
              Zatwierdź
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
          const audioNode = new AudioNode(audioSrc);
          const paragraphContainingAudio = $createParagraphNode();
          paragraphContainingAudio.append(audioNode);
          const paragraphContainingAudioKey = paragraphContainingAudio.getKey();

          const nodesToInsert: ParagraphNode[] = [paragraphContainingAudio];
          let transcriptionParagraphKey: string | null = null;

          if (transcription) {
            const transcriptionParagraph = $createParagraphNode();
            transcriptionParagraph.append($createTextNode(transcription));
            transcriptionParagraphKey = transcriptionParagraph.getKey();
            nodesToInsert.push(transcriptionParagraph);
          }

          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes(nodesToInsert);
          } else {
            const root = $getRoot();
            root.append(...nodesToInsert);
          }

          const actualParagraphContainingAudio = $getNodeByKey<ParagraphNode>(paragraphContainingAudioKey);
          if (!actualParagraphContainingAudio) {
            console.error("AudioPlugin: Failed to retrieve the inserted audio paragraph node.");
            return true; // Exit early
          }

          let lastContentNode: ParagraphNode = actualParagraphContainingAudio;
          if (transcription && transcriptionParagraphKey) {
            const actualTranscriptionParagraph = $getNodeByKey<ParagraphNode>(transcriptionParagraphKey);
            if (actualTranscriptionParagraph) {
              lastContentNode = actualTranscriptionParagraph;
            } else {
              console.warn("AudioPlugin: Failed to retrieve the inserted transcription paragraph node, using audio paragraph as last content node.");
            }
          }

          // Ensure paragraph BEFORE the first content node (actualParagraphContainingAudio)
          const paragraphBefore = actualParagraphContainingAudio.getPreviousSibling();
          if (!paragraphBefore || !$isParagraphNode(paragraphBefore)) {
            const newParagraphBefore = $createParagraphNode();
            actualParagraphContainingAudio.insertBefore(newParagraphBefore);
          }

          // Ensure paragraph AFTER the last content node (lastContentNode)
          let paragraphForCursor = lastContentNode.getNextSibling();
          if (!paragraphForCursor || !$isParagraphNode(paragraphForCursor)) {
            const newParagraphAfter = $createParagraphNode();
            lastContentNode.insertAfter(newParagraphAfter);
            paragraphForCursor = newParagraphAfter;
          }

          // Set selection to the paragraph after for better UX
          if (paragraphForCursor && $isParagraphNode(paragraphForCursor)) {
            paragraphForCursor.selectEnd();
          } else {
            lastContentNode.selectEnd(); // Fallback
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
