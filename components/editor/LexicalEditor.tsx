/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './index.css';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
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
import { SerializedDocument } from '@lexical/file';
import { FlashMessageContext } from './context/FlashMessageContext';

console.warn(
  'If you are profiling the playground app, please ensure you turn off the debug view. You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.',
);


import { useEffect } from 'react';

export default function LexicalEditor({
  onSave,
  onEditorChange,
  initialStateJSON,
  isEditable
}: {
  onSave: (serializedDocument: SerializedDocument) => boolean;
  onEditorChange: (editorState: string) => void;
  initialStateJSON: string | null;
  isEditable: boolean;
}): JSX.Element {
  const {
    settings: { measureTypingPerf },
  } = useSettings();

  const initialConfig = {
    editorState: initialStateJSON && initialStateJSON.trim() !== '' ? initialStateJSON : undefined,
    namespace: 'Playground',
    nodes: [...PlaygroundNodes],
    editable: isEditable,
    onError: (error: Error) => {
      throw error;
    },
    // theme: PlaygroundEditorTheme,
  };
  
  return (
    <SettingsContext>
      <FlashMessageContext>
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <TableContext>
          <SharedAutocompleteContext>
            <div className='flex flex-row'>
              <div className="editor-shell ">
                <Editor onSave={onSave} onEditorChange={onEditorChange} isEditable={isEditable}

                />
              </div>
              {/* <TableOfContentsPlugin /> */}
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