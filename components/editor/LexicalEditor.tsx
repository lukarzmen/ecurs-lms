/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './index.css';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { EditorState, LexicalEditor } from 'lexical';
import * as React from 'react';

import { SettingsContext, useSettings } from './context/SettingsContext';
import { SharedAutocompleteContext } from './context/SharedAutocompleteContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import DocsPlugin from './plugins/DocsPlugin';
import PasteLogPlugin from './plugins/PasteLogPlugin';
import { TableContext } from './plugins/TablePlugin';
import TestRecorderPlugin from './plugins/TestRecorderPlugin';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { useEffect, useRef } from 'react';
import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
import { Logo } from '@/app/(dashboard)/_components/logo';
import { SerializedDocument } from '@lexical/file';
import { FlashMessageContext } from './context/FlashMessageContext';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

console.warn(
  'If you are profiling the playground app, please ensure you turn off the debug view. You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.',
);


export default function LexicalEditor({
  onSave,
  onEditorChange,
  initialStateJSON,
  
}: {
  onSave: (serializedDocument: SerializedDocument) => boolean;
  onEditorChange: (editorState: string) => void;
  initialStateJSON: string | null;
}): JSX.Element {
  const {
    settings: { isCollab, emptyEditor, measureTypingPerf },
  } = useSettings();

  const initialConfig = {
    editorState: (editor : LexicalEditor) => {
      try {
        // Parse the JSON string and return the parsed editor state
        return initialStateJSON ? editor.parseEditorState(initialStateJSON) : editor.getEditorState();
      } catch (error) {
        console.error("Failed to load editor state from JSON:", error);
        return null; // Fallback to default state
      }
    },
    namespace: 'Playground',
    nodes: [...PlaygroundNodes],
    editable: true,
    onError: (error: Error) => {
      throw error;
    },
    // theme: PlaygroundEditorTheme,
  };

  const editorStateRef = useRef<EditorState | null>(null);


  
  return (
    <SettingsContext>
      <FlashMessageContext>
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <TableContext>
          <SharedAutocompleteContext>
            <div className='flex flex-row'>
              <div className="editor-shell ">
                <Editor onSave={onSave} onEditorChange={onEditorChange}

                />
              </div>
              <TableOfContentsPlugin />
            </div>
            <DocsPlugin />
            <PasteLogPlugin />
            <TestRecorderPlugin />

            {measureTypingPerf ? <TypingPerfPlugin /> : null}
          </SharedAutocompleteContext>
        </TableContext>

      </SharedHistoryContext>
    </LexicalComposer>
    </FlashMessageContext>   
    </SettingsContext>
  );
}