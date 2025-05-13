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
  $insertNodes,
  $isRootOrShadowRoot,
} from "lexical";
import { AudioNode } from "../../nodes/AudioNode"; // Ensure AudioNode is imported if needed for instanceof, though not directly used in this snippet
import ProgressSpinner from "../TextGeneratorPlugin/ProgressComponent";


export const CREATE_AUDIO_NODE_COMMAND: LexicalCommand<{ audioSrc: string; transcription?: string }> = createCommand(
  "CREATE_AUDIO_NODE_COMMAND"
);

// Helper function to convert File to Base64 Data URL
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });

export function TranscriptionDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [uploadType, setUploadType] = useState<"url" | "record" | "file" | null>(null);
  const [audioUrl, setAudioUrl] = useState(""); // Will store Base64 data URL or external URL
  const [recordingUrl, setRecordingAudioUrl] = useState(""); // For live preview of recording (can still be object URL)
  const [loading, setLoading] = useState(false);
  const [generateTranscription, setGenerateTranscription] = useState(false);
  const [file, setFile] = useState<File | null>(null); // Stores the selected or recorded file
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const base64Audio = await fileToBase64(file);
      setAudioUrl(base64Audio); // Set the main audioUrl to Base64 for the node
      // No server upload, audio is kept local as Base64
    } catch (error) {
      console.error("Błąd podczas konwersji pliku na Base64:", error);
      // Optionally, inform the user about the error
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
        // Note: Transcription API might not support Base64 directly in a 'url' field.
        // If /api/transcribe expects a URL, sending a long Base64 string might fail or be inefficient.
        // You might need to adjust /api/transcribe or send the Base64 data differently.
        // For this example, we'll assume it might work or this part needs further adjustment based on API capabilities.
        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioData: audioUrl }), // Sending as audioData, API needs to handle this
        });
        
        if (!response.ok) {
          console.warn("Transkrypcja nie powiodła się. Może to być spowodowane wysłaniem danych Base64 lub błędem API.");
        } else {
          const data = await response.json();
          generatedTranscription = data.transcription;
        }
      }

      activeEditor.dispatchCommand(CREATE_AUDIO_NODE_COMMAND, {
        audioSrc: audioUrl, // This will be the Base64 data URL or a user-provided external URL
        transcription: generateTranscription && generatedTranscription ? generatedTranscription : undefined,
      });
      onClose();

    } catch (error) {
      console.error("Błąd podczas generowania audio/transkrypcji:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      // The 'file' state will be set in mediaRecorder.onstop
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" }); // Or appropriate type
        const recordedFile = new File([audioBlob], "recording.mp3", { type: "audio/mp3" });
        setFile(recordedFile); // Set the recorded file to state
        
        // For immediate preview, an object URL is fine.
        // The actual Base64 conversion for the node will happen in handleUploadRecorded.
        setRecordingAudioUrl(URL.createObjectURL(audioBlob));
        
        // Clean up the media stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Błąd podczas nagrywania audio:", error);
      // Optionally, inform the user
    }
  };

  const handleUploadRecorded = async () => {
    if (!file) { // 'file' should be set from the recording
      console.error("Brak nagranego pliku do przetworzenia.");
      return;
    }
    setLoading(true);
    try {
      const base64Audio = await fileToBase64(file);
      setAudioUrl(base64Audio); // Set the main audioUrl to Base64 for the node
    } catch (error) {
      console.error("Błąd podczas konwersji nagrania na Base64:", error);
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
                <audio controls src={recordingUrl}> {/* Use src attribute directly for preview */}
                  Twoja przeglądarka nie obsługuje tagu audio.
                </audio>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-md mt-2" onClick={handleUploadRecorded} disabled={loading || !file}>
                  {loading ? "Przetwarzanie..." : "Użyj tego nagrania"}
                </button>
              </div>
            )}
          </>
        )}
        {uploadType === "file" && (
          <>
            <input type="file" accept="audio/*" onChange={(e) => {
              const selectedFile = e.target.files?.[0] || null;
              setFile(selectedFile);
              if (selectedFile) {
                // Optional: Preview for uploaded file
                // setRecordingAudioUrl(URL.createObjectURL(selectedFile)); 
              } else {
                // setRecordingAudioUrl("");
              }
            }} />
            <button className="px-4 py-2 bg-orange-500 text-white rounded-md mt-2" onClick={handleUpload} disabled={!file || loading}>
              {loading ? "Przetwarzanie..." : "Użyj tego pliku"}
            </button>
            {file && ( // Show preview if a file is selected
              <audio controls className="mt-4" src={URL.createObjectURL(file)}>
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
  );
}

export default function AudioPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    const unregisterCommand = editor.registerCommand<{ audioSrc: string; transcription?: string }>(
      CREATE_AUDIO_NODE_COMMAND,
      ({ audioSrc, transcription }) => {
        editor.update(() => {
          // Step 1: Create the main content node(s)
          const audioNode = new AudioNode(audioSrc); 

          // Create a paragraph to wrap the QuestionAnswerNode
          const paragraphWrapper = $createParagraphNode();
          paragraphWrapper.append(audioNode); // Put QuestionAnswerNode inside the paragraph

          // Insert the WRAPPING PARAGRAPH
          $insertNodes([paragraphWrapper]);

          // Get the newly inserted WRAPPING PARAGRAPH from the editor state
          const newlyInsertedParagraphKey = paragraphWrapper.getKey();
          const newlyInsertedParagraph = $getNodeByKey<ParagraphNode>(newlyInsertedParagraphKey);

          if (
            newlyInsertedParagraph &&
            $isParagraphNode(newlyInsertedParagraph) && // Ensure it's a ParagraphNode
            $isRootOrShadowRoot(newlyInsertedParagraph.getParentOrThrow())
          ) {
            // Ensure paragraph AFTER the wrapping paragraph
            let paragraphAfter = newlyInsertedParagraph.getNextSibling();
            if (!paragraphAfter || !$isParagraphNode(paragraphAfter)) {
              const newParagraphAfter = $createParagraphNode();
              newlyInsertedParagraph.insertAfter(newParagraphAfter);
              paragraphAfter = newParagraphAfter; 
            }

            // Ensure paragraph BEFORE the wrapping paragraph
            let paragraphBefore = newlyInsertedParagraph.getPreviousSibling();
            if (!paragraphBefore || !$isParagraphNode(paragraphBefore)) {
              const newActualParagraphBefore = $createParagraphNode();
              newlyInsertedParagraph.insertBefore(newActualParagraphBefore);
              paragraphBefore = newActualParagraphBefore;
            }

            // Set selection to the paragraph after the wrapping paragraph for a better UX
            if (paragraphAfter && $isParagraphNode(paragraphAfter)) {
              paragraphAfter.selectEnd();
            } else {
              newlyInsertedParagraph.selectEnd(); // Fallback
            }
          }
        });

        return true; // Indicate the command was handled
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      unregisterCommand();
    };
  }, [editor]);

  return null;
}
