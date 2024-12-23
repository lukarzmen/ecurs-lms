import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {createDOMRange, createRectsFromDOMRange} from '@lexical/selection';

import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  EditorState,
  KEY_ESCAPE_COMMAND,
  LexicalCommand,
  LexicalEditor,
  RangeSelection,
} from 'lexical';
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import * as React from 'react';

import Button from '../../ui/Button';
import { createComment, Thread, Comment } from '../../commenting';
import { $isRootTextContentEmpty, $rootTextContent } from '@lexical/text';
import CommentEditorTheme from '../../themes/CommentEditorTheme';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { createPortal } from 'react-dom';
import { $wrapSelectionInMarkNode } from '@lexical/mark';

export const TO_DICTIONARY_COMMAND: LexicalCommand<string> = createCommand(
  'TO_DICTIONARY_COMMAND'
);

//todo: skopiowane
function EscapeHandlerPlugin({
  onEscape,
}: {
  onEscape: (e: KeyboardEvent) => boolean;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event: KeyboardEvent) => {
        return onEscape(event);
      },
      2,
    );
  }, [editor, onEscape]);

  return null;
}
//todo: skopiowane
function PlainTextEditor({
  className,
  autoFocus,
  onEscape,
  onChange,
  editorRef,
  placeholder = 'Define topic...',
}: {
  autoFocus?: boolean;
  className?: string;
  editorRef?: {current: null | LexicalEditor};
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
  onEscape: (e: KeyboardEvent) => boolean;
  placeholder?: string;
}) {
  const initialConfig = {
    namespace: 'Commenting',
    nodes: [],
    onError: (error: Error) => {
      throw error;
    },
    theme: CommentEditorTheme,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="CommentPlugin_CommentInputBox_EditorContainer">
        <PlainTextPlugin
          contentEditable={
            <ContentEditable placeholder={placeholder} className={className} />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={onChange} />
        <HistoryPlugin />
        {autoFocus !== false && <AutoFocusPlugin />}
        <EscapeHandlerPlugin onEscape={onEscape} />
        <ClearEditorPlugin />
        {editorRef !== undefined && <EditorRefPlugin editorRef={editorRef} />}
      </div>
    </LexicalComposer>
  );
}

function DefinitionInputBox({
  editor,
  cancelAddComment,
  submitAddComment,
}: {
  cancelAddComment: () => void;
  editor: LexicalEditor;
  submitAddComment: (
    comment: Comment,
    isInlineComment: boolean,
    selection?: RangeSelection | null,
  ) => void;
}) {
  const [content, setContent] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const selectionState = useMemo(
    () => ({
      container: document.createElement('div'),
      elements: [],
    }),
    [],
  );
  const selectionRef = useRef<RangeSelection | null>(null);

  const updateLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selectionRef.current = selection.clone();
        const anchor = selection.anchor;
        const focus = selection.focus;
        const range = createDOMRange(
          editor,
          anchor.getNode(),
          anchor.offset,
          focus.getNode(),
          focus.offset,
        );
        const boxElem = boxRef.current;
        if (range !== null && boxElem !== null) {
          const {left, bottom, width} = range.getBoundingClientRect();
          const selectionRects = createRectsFromDOMRange(editor, range);
          let correctedLeft =
            selectionRects.length === 1 ? left + width / 2 - 125 : left - 125;
          if (correctedLeft < 10) {
            correctedLeft = 10;
          }
          boxElem.style.left = `${correctedLeft}px`;
          boxElem.style.top = `${
            bottom +
            20 +
            (window.pageYOffset || document.documentElement.scrollTop)
          }px`;
          const selectionRectsLength = selectionRects.length;
          const {container} = selectionState;
          const elements: Array<HTMLSpanElement> = selectionState.elements;
          const elementsLength = elements.length;

          for (let i = 0; i < selectionRectsLength; i++) {
            const selectionRect = selectionRects[i];
            let elem: HTMLSpanElement = elements[i];
            if (elem === undefined) {
              elem = document.createElement('span');
              elements[i] = elem;
              container.appendChild(elem);
            }
            const color = '255, 212, 0';
            const style = `position:absolute;top:${
              selectionRect.top +
              (window.pageYOffset || document.documentElement.scrollTop)
            }px;left:${selectionRect.left}px;height:${
              selectionRect.height
            }px;width:${
              selectionRect.width
            }px;background-color:rgba(${color}, 0.3);pointer-events:none;z-index:5;`;
            elem.style.cssText = style;
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i];
            container.removeChild(elem);
            elements.pop();
          }
        }
      }
    });
  }, [editor, selectionState]);

  useLayoutEffect(() => {
    updateLocation();
    const container = selectionState.container;
    const body = document.body;
    if (body !== null) {
      body.appendChild(container);
      return () => {
        body.removeChild(container);
      };
    }
  }, [selectionState.container, updateLocation]);

  useEffect(() => {
    window.addEventListener('resize', updateLocation);

    return () => {
      window.removeEventListener('resize', updateLocation);
    };
  }, [updateLocation]);

  const onEscape = (event: KeyboardEvent): boolean => {
    event.preventDefault();
    cancelAddComment();
    return true;
  };

  const submitComment = () => {
    if (canSubmit) {
      let quote = editor.getEditorState().read(() => {
        const selection = selectionRef.current;
        return selection ? selection.getTextContent() : '';
      });
      if (quote.length > 100) {
        quote = quote.slice(0, 99) + '…';
      }
      submitAddComment(
        createComment(content, "lmedyk"),
        true,
        selectionRef.current,
      );
      selectionRef.current = null;
    }
  };

  function useOnChange(
    setContent: (text: string) => void,
    setCanSubmit: (canSubmit: boolean) => void,
  ) {
    return useCallback(
      (editorState: EditorState, _editor: LexicalEditor) => {
        editorState.read(() => {
          setContent($rootTextContent());
          setCanSubmit(!$isRootTextContentEmpty(_editor.isComposing(), true));
        });
      },
      [setCanSubmit, setContent],
    );
  }
  
  const onChange = useOnChange(setContent, setCanSubmit);

  return (
    <div className="CommentPlugin_CommentInputBox" ref={boxRef}>
      <PlainTextEditor
        className="CommentPlugin_CommentInputBox_Editor"
        onEscape={onEscape}
        onChange={onChange}
      />
      <div className="CommentPlugin_CommentInputBox_Buttons">
        <Button
          onClick={cancelAddComment}
          className="CommentPlugin_CommentInputBox_Button">
          Cancel
        </Button>
        <Button
          onClick={submitComment}
          disabled={!canSubmit}
          className="CommentPlugin_CommentInputBox_Button primary">
          OK
        </Button>
      </div>
    </div>
  );
}

export function DictionaryPlugin() {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    editor.registerCommand(
      TO_DICTIONARY_COMMAND,
            () => {
              console.log('TO_DICTIONARY_COMMAND');
              const domSelection = window.getSelection();
              if (domSelection !== null) {
                domSelection.removeAllRanges();
              }
              setShowCommentInput(true);
              return true;
            },
            COMMAND_PRIORITY_EDITOR,
          );
  }, [editor]);
  

  const submitAddComment = useCallback(
    (
      commentOrThread: Comment | Thread,
      isInlineComment: boolean,
      selection?: RangeSelection | null,
    ) => {
      if (isInlineComment) {
        // editor.update(() => {
        //   if ($isRangeSelection(selection)) {
        //     const isBackward = selection.isBackward();
        //     const id = commentOrThread.id;

        //     // Wrap content in a MarkNode
        //     $wrapSelectionInMarkNode(selection, isBackward, id);
        //   }
        // });
        setShowCommentInput(false);
      }
    },
    [editor],
  );

    const cancelAddComment = useCallback(() => {
      // editor.update(() => {
      //   const selection = $getSelection();
      //   // Restore selection
      //   if (selection !== null) {
      //     selection.dirty = true;
      //   }
      // });
      setShowCommentInput(false);
    }, [editor]);

  return (
    <>
      {showCommentInput &&
        createPortal(
          <DefinitionInputBox
            editor={editor}
            cancelAddComment={cancelAddComment}
            submitAddComment={submitAddComment}
          />,
          document.body,
        )}
    </>
  );
}