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

import { SettingsContext } from './context/SettingsContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import Editor from './Editor';
import EditorNodes from './nodes/EditorNodes';
import { SerializedDocument } from '@lexical/file';
import { FlashMessageContext } from './context/FlashMessageContext';

import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { SaveResult } from './plugins/ActionsPlugin';

export default function LexicalEditor({
  onSave,
  onEditorChange,
  initialStateJSON,
  isEditable
}: {
  onSave: (serializedDocument: SerializedDocument) => SaveResult;
  onEditorChange: (editorState: string) => void;
  initialStateJSON: string | null;
  isEditable: boolean;
}): JSX.Element {

  const initialConfig = {
    editorState: initialStateJSON,
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
          </SharedHistoryContext>
        </LexicalComposer>
      </FlashMessageContext>
    </SettingsContext>
  );
}