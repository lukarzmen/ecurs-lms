"use client"

import { Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { SerializedDocument } from "@lexical/file";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import LexicalEditor from "@/components/editor/LexicalEditor";
import { calculatePayloadSize, formatFileSize } from "@/lib/upload-utils";

interface ChapterDescriptionFormProps {
  courseId: string;
  chapterId: string;
}

export const ChapterDescriptionForm = ({
  chapterId: moduleId,
}: ChapterDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Extract fetch logic to a function
  const [notFound, setNotFound] = useState(false);
  const fetchData = useCallback(() => {
    setIsLoading(true);
    setNotFound(false);
    fetch(`/api/content/${moduleId}`, {
      method: 'GET'
    })
      .then(response => {
        if (response.status === 404) {
          setNotFound(true);
          setSerializedEditorStateString(null);
          setIsLoading(false);
          return null;
        }
        if (!response.ok) {
          throw new Error('Błąd pobierania dokumentu edytora');
        }
        return response.json();
      })
      .then((serializedEditorState: string | null) => {
        if (!serializedEditorState) return;
        const data: SerializedDocument = JSON.parse(serializedEditorState);
        if (data.editorState.root.children.length === 0) {
          setSerializedEditorStateString(null);
          setIsLoading(false);
          return;
        }
        setSerializedEditorStateString(JSON.stringify(data.editorState));
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setIsLoading(false);
      });
  }, [moduleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleEdit = () => {
    if (isEditing) {
      // If cancelling, reload the initial state
      fetchData();
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleOnSave = (serializedDocument: SerializedDocument): SaveResult => {
    setIsLoading(true);
    
    // Handle the upload asynchronously but return immediately
    handleAsyncUpload(serializedDocument);
    
    return { success: true };
  };

  const handleAsyncUpload = async (serializedDocument: SerializedDocument) => {
    try {
      const payload = JSON.stringify(serializedDocument);
      const payloadSize = calculatePayloadSize(serializedDocument);
      
      setUploadProgress(`Przygotowywanie danych (${formatFileSize(payloadSize)})...`);
      
      // If payload is larger than 500KB, use chunked upload
      const CHUNK_THRESHOLD = 500 * 1024; // 500KB
      
      if (payloadSize > CHUNK_THRESHOLD) {
        setUploadProgress(`Duży plik (${formatFileSize(payloadSize)}) - przesyłanie w częściach...`);
        await handleChunkedUpload(payload);
      } else {
        setUploadProgress(`Przesyłanie (${formatFileSize(payloadSize)})...`);
        await handleRegularUpload(serializedDocument);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Coś poszło nie tak podczas zapisywania dokumentu");
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  const handleRegularUpload = async (serializedDocument: SerializedDocument) => {
    try {
      const response = await fetch(`/api/content/${moduleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serializedDocument),
      });
      
      if (response.status === 413) {
        toast.error("Treść jest za duża. Próbuję przesłać w częściach...");
        setUploadProgress("Treść za duża - przechodzę na przesyłanie w częściach...");
        await handleChunkedUpload(JSON.stringify(serializedDocument));
        return;
      }
      
      if (!response.ok) {
        toast.error("Błąd zapisu dokumentu");
        setIsLoading(false);
        setUploadProgress("");
        return;
      }
      
      toast.success("Zapisano dokument");
      fetchData();
      setIsEditing(false);
      setIsLoading(false);
      setUploadProgress("");
    } catch (error) {
      console.error('Regular upload error:', error);
      toast.error("Błąd połączenia podczas zapisywania dokumentu");
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  const handleChunkedUpload = async (payload: string) => {
    try {
      const CHUNK_SIZE = 400 * 1024; // 400KB chunks
      const chunks = [];
      
      // Split payload into chunks
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        chunks.push(payload.slice(i, i + CHUNK_SIZE));
      }
      
      const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      setUploadProgress(`Przesyłanie w ${chunks.length} częściach...`);
      
      // Send each chunk
      for (let i = 0; i < chunks.length; i++) {
        setUploadProgress(`Część ${i + 1}/${chunks.length}...`);
        
        const chunkInfo = {
          chunkIndex: i,
          totalChunks: chunks.length,
          sessionId: sessionId
        };
        
        const response = await fetch(`/api/content/${moduleId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-chunk',
            'X-Chunk-Info': JSON.stringify(chunkInfo),
          },
          body: chunks[i],
        });
        
        if (!response.ok) {
          toast.error(`Błąd przesyłania części ${i + 1}/${chunks.length}`);
          setIsLoading(false);
          setUploadProgress("");
          return;
        }
        
        // Handle streaming response for progress updates
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.error) {
                      toast.error(`Błąd: ${data.error}`);
                      setIsLoading(false);
                      setUploadProgress("");
                      return;
                    }
                    
                    if (data.status === 'complete') {
                      toast.success("Zapisano dokument");
                      fetchData();
                      setIsEditing(false);
                      setIsLoading(false);
                      setUploadProgress("");
                      return;
                    }
                    
                    if (data.progress) {
                      setUploadProgress(`Przetwarzanie... ${data.progress}%`);
                    }
                  } catch (e) {
                    // Skip invalid JSON lines
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      }
      
      setIsLoading(false);
      setUploadProgress("");
    } catch (error) {
      console.error('Chunked upload error:', error);
      toast.error("Błąd przesyłania w częściach");
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="mt-6 border bg-orange-100 rounded-md p-4 overflow-hidden">
      <div className="font-medium flex items-center justify-between">
        Treść
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? <>Anuluj</> : <>
            <Pencil className="h-4 w-4 mr-2"></Pencil>
            Edytuj
          </>}
        </Button>
      </div>
      {isLoading ? (
        <div className="flex flex-col justify-center items-center space-y-2">
          <Loader2 className="animate-spin text-orange-700" size={32} />
          {uploadProgress && (
            <div className="text-sm text-orange-600 font-medium">
              {uploadProgress}
            </div>
          )}
        </div>
      ) : notFound && !isEditing ? (
        <div className="space-y-4 mt-4 text-center text-orange-700 font-semibold">
          Treść nie istnieje. Edytuj aby utworzyć treść lekcji.
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <div>
            <LexicalEditor
              initialStateJSON={notFound ? null : serializedEditorStateString}
              onSave={handleOnSave}
              isEditable={isEditing}
              onEditorChange={() => {
              }}
              onCompleted={() => {
              }}
              isCompleted={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterDescriptionForm;
