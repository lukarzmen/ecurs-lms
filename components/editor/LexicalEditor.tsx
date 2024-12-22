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
import EditorNodes from './nodes/EditorNodes';
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
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

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

  const initialConfig = {
    editorState: initialStateJSON && initialStateJSON.trim() !== '' ? initialStateJSON : undefined,
    namespace: 'Playground',
    nodes: [...EditorNodes],
    editable: isEditable,
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme
  };

  return (
    <SettingsContext>
      <FlashMessageContext>
        <LexicalComposer initialConfig={initialConfig}>
          <SharedHistoryContext>
            <div className='flex flex-row'>
              <div className="editor-shell ">
                <Editor onSave={onSave} onEditorChange={onEditorChange} isEditable={isEditable} />
              </div>
            </div>
            <DocsPlugin />
            <PasteLogPlugin />
          </SharedHistoryContext>
        </LexicalComposer>
      </FlashMessageContext>
    </SettingsContext>
  );
}