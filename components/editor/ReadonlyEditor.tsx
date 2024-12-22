import React, { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import EditorNodes from './nodes/EditorNodes';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';

const ReadOnlyEditor = ({ content }: {content: string | null;}) => {
    // Konfiguracja początkowa Lexical
    const initialConfig = {
        namespace: 'ReadOnlyEditor',
        editorState: content && content.trim() !== '' ? content : undefined,
        editable: false, 
        onError: (error) => {
            console.error('Lexical Error:', error);
        },
        nodes: [...EditorNodes],
    };
    const placeholder = "Start typing here...";

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className='flex flex-row'>
                <div className="editor-shell ">
                    <div className='editor-container'> 
                    <RichTextPlugin
                        contentEditable={<div className="editor-scroller">
                            <div className="editor">
                            <ContentEditable placeholder={placeholder} />
                            </div>
                          </div>}
                        placeholder={null}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                </div>
            </div>
            </div>
        </LexicalComposer>
    );
};

export default ReadOnlyEditor;