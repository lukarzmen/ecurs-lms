"use client"

import { Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { FormCard, FormSection } from "@/components/ui/form-card";
import { Pencil, FileText, Edit3 } from "lucide-react";
import { SerializedDocument } from "@lexical/file";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import LexicalEditor from "@/components/editor/LexicalEditor";
import { ModuleContextData } from "@/components/editor/context/CourseContext";
import { calculatePayloadSize, formatFileSize } from "@/lib/upload-utils";
import { useI18n } from "@/hooks/use-i18n";

interface ChapterDescriptionFormProps {
  courseId: string;
  chapterId: string;
}

interface CourseModuleData {
  course?: {
    id: string;
    title: string;
  };
  module?: {
    id: string;
    title: string;
  };
}

export const ChapterDescriptionForm = ({
  courseId,
  chapterId: moduleId,
}: ChapterDescriptionFormProps) => {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [courseModuleData, setCourseModuleData] = useState<CourseModuleData>({});

  // Extract fetch logic to a function
  const [notFound, setNotFound] = useState(false);
  
  // Function to fetch course and module information
  const fetchCourseModuleData = useCallback(async () => {
    try {
      const [courseResponse, moduleResponse] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/module/${moduleId}`)
      ]);

      const courseData = courseResponse.ok ? await courseResponse.json() : null;
      const moduleData = moduleResponse.ok ? await moduleResponse.json() : null;

      setCourseModuleData({
        course: courseData ? { id: courseData.id.toString(), title: courseData.title } : undefined,
        module: moduleData ? { id: moduleData.id.toString(), title: moduleData.title } : undefined,
      });
    } catch (error) {
      console.error('Error fetching course/module data:', error);
    }
  }, [courseId, moduleId]);

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
          throw new Error(t('chapterDescriptionForm.fetchDocumentError'));
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
  }, [moduleId, t]);

  useEffect(() => {
    fetchData();
    fetchCourseModuleData();
  }, [fetchData, fetchCourseModuleData]);

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
      setUploadProgress(t('chapterDescriptionForm.preparingData').replace('{size}', formatFileSize(payloadSize)));
      
      // If payload is larger than 500KB, use chunked upload
      const CHUNK_THRESHOLD = 500 * 1024; // 500KB
      
      if (payloadSize > CHUNK_THRESHOLD) {
        setUploadProgress(t('chapterDescriptionForm.largeFile').replace('{size}', formatFileSize(payloadSize)));
        await handleChunkedUpload(payload);
      } else {
        setUploadProgress(t('chapterDescriptionForm.uploading').replace('{size}', formatFileSize(payloadSize)));
        await handleRegularUpload(serializedDocument);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('chapterDescriptionForm.saveError'));
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
        toast.error(t('chapterDescriptionForm.tooLarge'));
        setUploadProgress(t('chapterDescriptionForm.switchToChunks'));
        await handleChunkedUpload(JSON.stringify(serializedDocument));
        return;
      }
      
      if (!response.ok) {
        toast.error(t('chapterDescriptionForm.saveDocumentError'));
        setIsLoading(false);
        setUploadProgress("");
        return;
      }
      
      toast.success(t('chapterDescriptionForm.documentSaved'));
      setIsEditing(false);
      setUploadProgress("");
      // Fetch new data after successful save
      fetchData();
    } catch (error) {
      console.error('Regular upload error:', error);
      toast.error(t('chapterDescriptionForm.connectionSaveError'));
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
      
      setUploadProgress(t('chapterDescriptionForm.chunkCount').replace('{count}', String(chunks.length)));
      
      // Send each chunk
      for (let i = 0; i < chunks.length; i++) {
        setUploadProgress(t('chapterDescriptionForm.chunkProgress').replace('{current}', String(i + 1)).replace('{total}', String(chunks.length)));
        
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
          toast.error(t('chapterDescriptionForm.chunkError').replace('{current}', String(i + 1)).replace('{total}', String(chunks.length)));
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
                      toast.error(t('chapterDescriptionForm.serverError').replace('{error}', data.error));
                      setIsLoading(false);
                      setUploadProgress("");
                      return;
                    }
                    
                    if (data.status === 'complete') {
                      toast.success(t('chapterDescriptionForm.documentSaved'));
                      fetchData();
                      setIsEditing(false);
                      setIsLoading(false);
                      setUploadProgress("");
                      return;
                    }
                    
                    if (data.progress) {
                      setUploadProgress(t('chapterDescriptionForm.processing').replace('{progress}', String(data.progress)));
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
      toast.error(t('chapterDescriptionForm.chunkUploadError'));
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="mt-6">
      <FormCard
        title={t('chapterDescriptionForm.title')}
        icon={FileText}
        status={{
          label: isEditing ? t('chapterDescriptionForm.editing') : (notFound ? t('chapterDescriptionForm.noContent') : t('chapterDescriptionForm.saved')),
          variant: isEditing ? "secondary" : (notFound ? "outline" : "default"),
          className: notFound ? "" : (isEditing ? "bg-blue-500 text-white" : "bg-green-500"),
          icon: isEditing ? Edit3 : (notFound ? FileText : undefined)
        }}
        isLoading={isLoading}
        loadingMessage={uploadProgress || t('chapterDescriptionForm.loading')}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{t('chapterDescriptionForm.subtitle')}</span>
          <Button onClick={toggleEdit} variant="ghost" size="sm">
            {isEditing ? <>{t('common.cancel')}</> : <>
              <Pencil className="h-4 w-4 mr-2"></Pencil>
              {t('common.edit')}
            </>}
          </Button>
        </div>
        
        {notFound && !isEditing ? (
          <FormSection variant="warning">
            <p>
              <strong>{t('chapterDescriptionForm.noContentTitle')}</strong><br />
              {t('chapterDescriptionForm.noContentHint')}
            </p>
          </FormSection>
        ) : (
          <div className="min-h-[200px]">
            <LexicalEditor
              initialStateJSON={notFound ? null : serializedEditorStateString}
              onSave={handleOnSave}
              isEditable={isEditing}
              onEditorChange={() => {
              }}
              onCompleted={() => {
              }}
              isCompleted={true}
              module={{
                courseId,
                courseName: courseModuleData.course?.title,
                moduleId,
                moduleName: courseModuleData.module?.title,
              }}
            />
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default ChapterDescriptionForm;
