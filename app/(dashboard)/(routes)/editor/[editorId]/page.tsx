"use client";

import { SerializedDocument } from "@lexical/file";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import LexicalEditor from "@/components/editor/LexicalEditor";
import { useState, useEffect } from "react";
import { Dictionary, DictionaryNode } from "@/components/editor/nodes/DictionaryNode";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const EditorPage = ({ params }: { params: { editorId: string } }) => {
    // const { isLoaded, userId } = useAuth();

    // if (!isLoaded) {
    //     return <div>Loading...</div>;
    // }

    // if(!userId) {
    //     return redirect(`/sign-in?redirectUrl=/editor/${params.editorId}`);
    //   }
    const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);


    const [isLoading, setIsLoading] = useState(true);

    const fetchData = () => {
        setIsLoading(true);
        fetch(`/api/editor/${params.editorId}`, {
            method: 'GET'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd pobierania dokumentu edytora');
                }
                return response.json();
            })
            .then((serializedEditorState: SerializedDocument) => {
                setSerializedEditorStateString(JSON.stringify(serializedEditorState.editorState));
            })
            .catch(error => {
                console.error('Error:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, [params.editorId]);

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
                success: true,
                hash: ''
              };
              return saveResult;
            }}
          />
        )}
      </div>
    );
};

export default EditorPage;
