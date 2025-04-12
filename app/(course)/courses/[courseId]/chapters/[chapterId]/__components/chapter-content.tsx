"use client";

import LexicalEditor from "@/components/editor/LexicalEditor";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import { SerializedDocument } from "@lexical/file";
import { useEffect, useState } from "react";

export default function ChapterContent ({
    content
}: {
    content: string | null;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);

    useEffect(() => {
      const fetchData = () => {
        setIsLoading(true);
        fetch(`/api/content/${content}`, {
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
            setSerializedEditorStateString(JSON.stringify(data.editorState));
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error:', error);
            setIsLoading(false);
          });
      };

      fetchData();
    }, [content]);

    return (
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center">
            Loading...
          </div>
        ) : (
          <LexicalEditor
            initialStateJSON={serializedEditorStateString}
            isEditable={false}
            onEditorChange={() => {}}
            onSave={(serializedDocument) => {
              const saveResult: SaveResult = {
                success: true
              };
              return saveResult;
            }}
          />
        )}
      </div>
    );
}