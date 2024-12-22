"use client";

import PlaygroundApp from "@/components/editor/LexicalEditor";
import { SerializedDocument } from "@lexical/file";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

import ToolbarPlugin from "@/components/editor/plugins/ToolbarPlugin";
import { useState } from "react";
import PlaygroundEditorTheme from "@/components/editor/themes/PlaygroundEditorTheme";
import EditorNodes from "@/components/editor/nodes/EditorNodes";

export default function FillTheGapPage() {

    const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

    const initialConfig = {
        namespace: 'MyEditor',
        nodes: [...EditorNodes],
        editable: true,
        onError: (error: Error) => {
            throw error;
        },
        theme: PlaygroundEditorTheme
    };

    function onChange(editorState: any) {
        editorState.read(() => {
            // Read the contents of the EditorState here.
            const textContent = editorState.toString();
            console.log(textContent);
        });
    }


    return (
        <div className="p-6">
            <LexicalComposer initialConfig={initialConfig}>
                <div className='flex flex-row'>
                    <div className="editor-shell">
                            <ToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
                            <RichTextPlugin
                                contentEditable={<ContentEditable />}
                                placeholder={<div>Enter some text...</div>} ErrorBoundary={({ children }) => <>{children}</>}/>
                            </div>
                    </div>
                <HistoryPlugin />
                <OnChangePlugin onChange={onChange} />
            </LexicalComposer>
        </div>
    );
}