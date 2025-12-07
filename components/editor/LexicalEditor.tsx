import './index.css';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import * as React from 'react';

import { SettingsContext } from './context/SettingsContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import { CourseProvider } from './context/CourseContext';
import Editor from './Editor';
import EditorNodes from './nodes/EditorNodes';
import { SerializedDocument } from '@lexical/file';
import { FlashMessageContext } from './context/FlashMessageContext';

import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { SaveResult } from './plugins/ActionsPlugin';
import { ToolbarContext } from './context/ToolbarContext';
import { ModuleContextData } from './context/CourseContext';

interface LexicalEditorProps {
  onSave: (serializedDocument: SerializedDocument) => SaveResult;
  onEditorChange: (editorState: string) => void;
  initialStateJSON: string | null;
  isEditable: boolean;
  isCompleted?: boolean;
  onCompleted: () => void;
  module?: ModuleContextData;
}
export default function LexicalEditor({
  onSave,
  onEditorChange,
  initialStateJSON,
  isEditable,
  isCompleted,
  onCompleted,
  module,
}: LexicalEditorProps): JSX.Element {
  const editorConfig = {
    editorState: null,
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
        <LexicalComposer initialConfig={editorConfig}>
           <ToolbarContext>
             <SharedHistoryContext>
               <CourseProvider module={module}>
                 <div className='flex flex-row'>
                   <div className="editor-shell ">
                     <Editor onSave={onSave} onEditorChange={onEditorChange} isCompleted={isCompleted} isEditable={isEditable} onCompleted={onCompleted} initialStateJSON={initialStateJSON} />
                   </div>
                 </div>
               </CourseProvider>
             </SharedHistoryContext>
           </ToolbarContext>
        </LexicalComposer>
      </FlashMessageContext>
    </SettingsContext>
  );
}
