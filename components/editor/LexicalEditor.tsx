import './index.css';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { SettingsContext } from './context/SettingsContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import Editor from './Editor';
import EditorNodes from './nodes/EditorNodes';
import { SerializedDocument } from '@lexical/file';
import { FlashMessageContext } from './context/FlashMessageContext';

import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { SaveResult } from './plugins/ActionsPlugin';
import { ToolbarContext } from './context/ToolbarContext';
interface LexicalEditorProps {
  onSave: (serializedDocument: SerializedDocument) => SaveResult;
  onEditorChange: (editorState: string) => void;
  initialStateJSON: string | null;
  isEditable: boolean;
  isCompleted?: boolean;
  onCompleted: () => void;
}
export default function LexicalEditor({
  onSave,
  onEditorChange,
  initialStateJSON,
  isEditable,
  isCompleted,
  onCompleted,
}: LexicalEditorProps): JSX.Element {

  const [editorConfig, setEditorConfig] = useState({
    editorState: initialStateJSON,
    namespace: 'Playground',
    nodes: [...EditorNodes],
    editable: isEditable,
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme
  });

  useEffect(() => {
    setEditorConfig((prevConfig) => ({
      ...prevConfig,
      editorState: initialStateJSON,
      editable: isEditable,
    }));
  }, [initialStateJSON, isEditable]);

  return (
    <SettingsContext>
      <FlashMessageContext>
        <LexicalComposer initialConfig={editorConfig}>
           <ToolbarContext>
             <SharedHistoryContext>
               <div className='flex flex-row'>
                 <div className="editor-shell ">
                   <Editor onSave={onSave} onEditorChange={onEditorChange} isCompleted={isCompleted} isEditable={isEditable} onCompleted={onCompleted} />
                 </div>
               </div>
             </SharedHistoryContext>
           </ToolbarContext>
        </LexicalComposer>
      </FlashMessageContext>
    </SettingsContext>
  );
}
