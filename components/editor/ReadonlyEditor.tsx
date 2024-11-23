import React, { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

const ReadOnlyEditor = ({ content }: {content:string}) => {
    // Konfiguracja początkowa Lexical
    const initialConfig = {
        namespace: 'ReadOnlyEditor',
        editorState: content,
        readOnly: true, // Włączenie trybu read-only
        onError: (error) => {
            console.error('Lexical Error:', error);
        },
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className='flex flex-row'>
                <div className="editor-shell ">
                    <div className='editor-container'> 
                    <PlainTextPlugin
                        contentEditable={<div className="editor-scroller">
                            <div className="editor">
                              <ContentEditable placeholder="" />
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