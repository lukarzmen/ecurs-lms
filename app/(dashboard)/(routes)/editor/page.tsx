"use client"

import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';

import ExampleTheme from './ExampleTheme';
import ToolbarPlugin from './_plugins/ToolbarPlugin';
import TreeViewPlugin from './_plugins/TreeViewPlugin';
import "./styles.css";
const placeholder = 'Enter some rich text...';

const editorConfig = {
  namespace: 'React.js Demo',
  nodes: [],
  // Handling of errors during update
  onError(error: Error) {
    throw error;
  },
  // The editor theme
  theme: ExampleTheme,
};


export default function EditorPage() {
    return (
        <div className="p-6">
            <LexicalComposer initialConfig={editorConfig}>
                <div className="editor-container">
                <ToolbarPlugin />
                <div className="editor-inner">
                    <RichTextPlugin contentEditable={
                        <ContentEditable
                        className="editor-input"
                        aria-placeholder={placeholder}
                        placeholder={
                            <div className="editor-placeholder">{placeholder}</div>
                        }
                        />
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <TreeViewPlugin />
                </div>
                </div>
            </LexicalComposer>
      </div>
    );
  }