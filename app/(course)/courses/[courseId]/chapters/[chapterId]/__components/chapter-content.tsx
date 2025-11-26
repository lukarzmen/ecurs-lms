"use client";

import LexicalEditor from "@/components/editor/LexicalEditor";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import { ModuleContextData } from "@/components/editor/context/CourseContext";
import { SerializedDocument } from "@lexical/file";
import { useEffect, useState } from "react";
import { Loader2, Hourglass } from "lucide-react";

export default function ChapterContent ({
  moduleId: moduleId,
  isCompleted,
  onCompleted,
  isCompleting = false,
  module
}: {
  moduleId: string | null;
  isCompleted: boolean;
  onCompleted: () => void;
  isCompleting?: boolean;
  module?: ModuleContextData;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

    useEffect(() => {
      const fetchData = () => {
        setIsLoading(true);
        setLoadError(false);
        fetch(`/api/content/${moduleId}`, {
          method: 'GET'
        })
          .then(response => {
            if (!response.ok) {
              setLoadError(true);
              setIsLoading(false);
              return null;
            }
            return response.json();
          })
          .then((serializedEditorState: string | null) => {
            if (!serializedEditorState) return;
            const data: SerializedDocument = JSON.parse(serializedEditorState);
            if(data.editorState.root.children.length === 0){
              setSerializedEditorStateString(null);
              setIsLoading(false);
              return;
            }
            setSerializedEditorStateString(JSON.stringify(data.editorState));
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error:', error);
            setLoadError(true);
            setIsLoading(false);
          });
      };

      fetchData();
    }, [moduleId]);

    return (
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-orange-700" size={32} />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
            <Hourglass className="w-12 h-12 mb-4 text-gray-400" />
            <div className="text-lg font-medium">Treść w przygotowaniu</div>
          </div>
        ) : (
          <LexicalEditor
            initialStateJSON={serializedEditorStateString}
            isEditable={false}
            isCompleted={isCompleted}
            onEditorChange={() => {}}
            onSave={(serializedDocument) => {
              const saveResult: SaveResult = {
                success: true
              };
              return saveResult;
            }}
            onCompleted={() => {
              if (!isCompleting && !isCompleted) {
                onCompleted();
              }
            }}
            module={module}
          />
        )}
      </div>
    );
}