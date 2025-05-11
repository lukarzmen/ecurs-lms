"use client";

import LexicalEditor from "@/components/editor/LexicalEditor";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import { SerializedDocument } from "@lexical/file";
import { set } from "lodash-es";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function ChapterContent ({
    moduleId: moduleId,
    isCompleted,
    onCompleted
}: {
    moduleId: string | null;
    isCompleted: boolean;
    onCompleted: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);

    useEffect(() => {
      const fetchData = () => {
        setIsLoading(true);
        fetch(`/api/content/${moduleId}`, {
          method: 'GET'
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('Error fetching initial state');
            }
            return response.json();
          })
          .then((serializedEditorState: string) => {
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
              onCompleted();
            }}
          />
        )}
      </div>
    );
}