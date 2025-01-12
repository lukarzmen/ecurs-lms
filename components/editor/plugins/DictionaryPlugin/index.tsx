import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  RangeSelection,
} from 'lexical';
import {useCallback, useEffect, useState} from 'react';
import * as React from 'react';
import { Thread, Comment } from '../../commenting';
import { createPortal } from 'react-dom';
import { CommentInputBox } from '../CommentPlugin';
import { DefinitionNode } from '../../nodes/DefinitionNode';
import { $wrapNodeInElement } from '@lexical/utils';

export const TO_DICTIONARY_COMMAND: LexicalCommand<string> = createCommand(
  'TO_DICTIONARY_COMMAND'
);

export function DictionaryPlugin() {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    return editor.registerCommand(
      TO_DICTIONARY_COMMAND,
      () => {
        // Capture the selected text when the command is triggered
        const selection = editor.getEditorState().read($getSelection);
        if (selection) {
          setSelectedText(selection.getTextContent());
        }
        setShowCommentInput(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);
  
  const submitAddComment = useCallback(
    (commentOrThread: Comment | Thread, isInlineComment: boolean) => {
      editor.update(() => {
        const content = 'content' in commentOrThread ? commentOrThread.content : '';
        const definitionNode = new DefinitionNode(selectedText, content);
        
        const selection = $getSelection();
        if (selection) {
          // Remove the selected text
          // selection.removeText();
          
          // Insert the definition node
          selection.insertNodes([definitionNode]);
          
          // Wrap in paragraph if needed
          if ($isRootOrShadowRoot(definitionNode.getParentOrThrow())) {
            $wrapNodeInElement(definitionNode, $createParagraphNode).selectEnd();
          }
        }
      });
      
      setShowCommentInput(false);
      setSelectedText('');
    },
    [editor, selectedText]
  );

  const cancelAddComment = useCallback(() => {
    setShowCommentInput(false);
    setSelectedText('');
  }, []);

  return (
    <>
      {showCommentInput &&
        createPortal(
          <CommentInputBox
            editor={editor}
            cancelAddComment={cancelAddComment}
            submitAddComment={submitAddComment}
          />,
          document.body,
        )}
    </>
  );
}