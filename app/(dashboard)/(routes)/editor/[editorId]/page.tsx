"use client";

import PlaygroundApp from "@/components/editor/LexicalEditor";
import { SerializedDocument } from "@lexical/file";
import { hashDocument } from "@/services/HashedService";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import { useEffect, useState } from "react";
import ReadOnlyEditor from "@/components/editor/ReadonlyEditor";
import LexicalEditor from "@/components/editor/LexicalEditor";

const EditorPage = ({ params }: { params: { editorId: string } }) => {
    const [initialStateJSON, setInitialState] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/editor/${params.editorId}`, {
                    method: 'GET'
                });

                if (!response.ok) {
                    throw new Error('Error fetching initial state');
                }

                const initialStateJSON = await response.text();
                setInitialState(initialStateJSON);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [initialStateJSON]);

    return (
        <div className="p-6">

            <LexicalEditor initialStateJSON={initialStateJSON} isEditable={false} onEditorChange={() => {

            }} onSave={(serializedDocument) => {
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
