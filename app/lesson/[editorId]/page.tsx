"use client";

import { SerializedDocument } from "@lexical/file";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import LexicalEditor from "@/components/editor/LexicalEditor";
import { useState, useEffect } from "react";
import { Dictionary, DictionaryNode } from "@/components/editor/nodes/DictionaryNode";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const EditorPage = ({ params }: { params: { editorId: string } }) => {
    
    const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);
    const { isLoaded, userId } = useAuth();

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    if(!userId) {
        return redirect("/sign-in");
    }
    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`/api/editor/${params.editorId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Error fetching initial state');
            }

            const serializedEditorState: SerializedDocument = await response.json();
            setSerializedEditorStateString(JSON.stringify(serializedEditorState.editorState));
        };

        fetchData();
    }, [params.editorId]);

    if (serializedEditorStateString === null) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6">
            
            <LexicalEditor initialStateJSON={serializedEditorStateString} isEditable={false} onEditorChange={() => {

            }} onSave={() => {
                const saveResult: SaveResult = {
                    success: true,
                    hash: ''
                };
                return saveResult;
            }}/>
        </div>
    );
};

export default EditorPage;
