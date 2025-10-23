/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {CheckListPlugin} from '@lexical/react/LexicalCheckListPlugin';
import {ClearEditorPlugin} from '@lexical/react/LexicalClearEditorPlugin';
import {ClickableLinkPlugin} from '@lexical/react/LexicalClickableLinkPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {HorizontalRulePlugin} from '@lexical/react/LexicalHorizontalRulePlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {TabIndentationPlugin} from '@lexical/react/LexicalTabIndentationPlugin';
import {TablePlugin} from '@lexical/react/LexicalTablePlugin';
import * as React from 'react';
import {useEffect, useState} from 'react';
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableHoverActionsPlugin from './plugins/TableHoverActionsPlugin';
import {useSettings} from './context/SettingsContext';
import {useSharedHistoryContext} from './context/SharedHistoryContext';
import { SaveResult } from './plugins/ActionsPlugin';
import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import CollapsiblePlugin from './plugins/CollapsiblePlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import EmojisPlugin from './plugins/EmojisPlugin';
import EquationsPlugin from './plugins/EquationsPlugin';
import ExcalidrawPlugin from './plugins/ExcalidrawPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import KeywordsPlugin from './plugins/KeywordsPlugin';
import {LayoutPlugin} from './plugins/LayoutPlugin/LayoutPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin';
import {MaxLengthPlugin} from './plugins/MaxLengthPlugin';
import PageBreakPlugin from './plugins/PageBreakPlugin';
import QuizPlugin from './plugins/QuizPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import YouTubePlugin from './plugins/YouTubePlugin';
import ContentEditable from './ui/ContentEditable';
import { SerializedDocument, serializedDocumentFromEditorState } from '@lexical/file';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DictionaryPlugin } from './plugins/DictionaryPlugin';
import { GenerateDictionaryPlugin } from './plugins/GenerateDictionaryPlugin';
import TextGeneratorPlugin from './plugins/TextGeneratorPlugin';
import QuestionAnswerPlugin from './plugins/QuestionAnswerPlugin';
import GapNodePlugin from './plugins/GapPlugin';
import DescriptionPlugin from './plugins/DescriptionPlugin';
import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
import TranslationPlugin from './plugins/TranslationPlugin';
import AudioPlugin from './plugins/AudioPlugin';
import SelectAnswerPlugin from './plugins/SelectAnswerPlugin';
import TaskPlugin from './plugins/TaskPlugin';
import { $getRoot, $isElementNode, LexicalNode } from 'lexical';
import { TodoPlugin } from './plugins/TodoPlugin';
import NewToolbarPlugin from './plugins/ToolbarPlugin';
import { CAN_USE_DOM } from './shared/canUseDOM';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import FloatingTextFormatToolbarPlugin from './plugins/FloatingTextFormatToolbarPlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';


// Helper function to recursively find nodes with __isCompleted property
function $findNodesWithIsCompleted(
    node: LexicalNode,
    result: LexicalNode[]
): void {
    // Check if the node has the __isCompleted property using 'in' operator
    // This is safer than direct access if the property might not exist.
    if ('__isCompleted' in node) {
        result.push(node);
    }

    // If the node is an element node, recurse through its children
    if ($isElementNode(node)) {
        const children = node.getChildren();
        for (const child of children) {
            $findNodesWithIsCompleted(child, result);
        }
    }
}


export default function Editor( {
  onSave,
  onEditorChange,
  isEditable,
  isCompleted,
  onCompleted,
}: {
  onSave: (serializedDocument: SerializedDocument) => SaveResult;
  onEditorChange: (editorState: string) => void;
  isEditable: boolean;
  isCompleted?: boolean;
  onCompleted: () => void;
}): JSX.Element {

  const {historyState} = useSharedHistoryContext();
  const {
    settings: {
      showTableOfContents,
      isAutocomplete,
      isMaxLength,
      hasLinkAttributes,
      shouldPreserveNewLinesInMarkdown,
      tableCellMerge,
      tableCellBackgroundColor,
    },
  } = useSettings();

  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const completedCalled = React.useRef(false);
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia('(max-width: 1025px)').matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener('resize', updateViewPortWidth);

    return () => {
      window.removeEventListener('resize', updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  useEffect(() => {
    const unregisterListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        if (isCompleted) {
          console.debug("Editor is completed, skipping completion check.");
          return; // Skip completion check if isCompleted is true
        }
        const root = $getRoot();
        if (root.isEmpty()) {
          console.debug("Editor is empty");
          return;
        }
        const completableNodes: LexicalNode[] = [];
        $findNodesWithIsCompleted(root, completableNodes);
        console.debug('Nodes with __isCompleted:', completableNodes);

        const callOnCompletedWithDelay = () => {
          if (!completedCalled.current) {
            completedCalled.current = true;
            setTimeout(() => {
              onCompleted();
            }, 300);
          }
        };

        if (completableNodes.length > 0) {
          const allCompleted = completableNodes.every((node) => (node as any).__isCompleted === true);
          if (allCompleted) {
            // Notify parent component that all completable nodes are completed
            callOnCompletedWithDelay();
          }
          console.debug(`All completable nodes completed: ${allCompleted}`);
        } else {
          callOnCompletedWithDelay();
          console.debug('No nodes with __isCompleted found.');
        }
      });

      // Serialize and notify parent component of the change regardless of completion state
      const serializedState = JSON.stringify(editorState.toJSON());
      onEditorChange(serializedState);
    });

    // Set initial editable state
    editor.setEditable(isEditable);

    // Cleanup listener on component unmount
    return () => unregisterListener();
  }, [editor, onEditorChange, isEditable, isCompleted, onCompleted]); // Dependencies for the effect


  function handleSave() {
        const serializedDocument: SerializedDocument = serializedDocumentFromEditorState(editor.getEditorState(), {
          source: 'Playground',
        });
        onSave(serializedDocument);
  }

  return (
    <>
      {showTableOfContents && <TableOfContentsPlugin />}
      {isEditable && <NewToolbarPlugin 
              editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
      setIsLinkEditMode={setIsLinkEditMode} onSave={handleSave} />}
      <div
        className={`editor-container plain-text`}>
        {isMaxLength && <MaxLengthPlugin maxLength={30} />}
        <DragDropPaste />
        <AutoFocusPlugin />
        <ClearEditorPlugin />
        {/* <ComponentPickerPlugin /> */}
        <EmojiPickerPlugin />
        <AutoEmbedPlugin />

        {/* todo do pobierania lista osob <MentionsPlugin /> */}
        <EmojisPlugin />
        <GapNodePlugin/>
        <HashtagPlugin />
        <TranslationPlugin />
        <KeywordsPlugin />
        <AutoLinkPlugin />
        <AudioPlugin/>
        <DictionaryPlugin />
        <SelectAnswerPlugin />
        <HistoryPlugin externalHistoryState={historyState} />
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor" ref={onRef}>
                <ContentEditable placeholder={""} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        {/* <FloatingTextFormatToolbarPlugin /> */}
        {/* <MarkdownShortcutPlugin /> */}
        <CodeHighlightPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <ListMaxIndentLevelPlugin maxDepth={7} />
        <TablePlugin
          hasCellMerge={tableCellMerge}
          hasCellBackgroundColor={tableCellBackgroundColor}
        />
        <TableCellResizer />
        <ImagesPlugin />
        <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
        <TextGeneratorPlugin />
        <QuizPlugin />
        <TodoPlugin />
        <GenerateDictionaryPlugin />
        <TaskPlugin/>
        <QuestionAnswerPlugin />
        <DescriptionPlugin />
        <YouTubePlugin />
        <ClickableLinkPlugin disabled={isEditable} />
        <HorizontalRulePlugin />
        <EquationsPlugin />
        <ExcalidrawPlugin />
        <TabFocusPlugin />
        <TabIndentationPlugin />
        <CollapsiblePlugin />
        <PageBreakPlugin />
{floatingAnchorElem && (
              <>
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
                <TableCellActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={true}
                />
              </>
            )}
            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
                <FloatingTextFormatToolbarPlugin
                  anchorElem={floatingAnchorElem}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
              </>
            )}
        {/* {isAutocomplete && <AutocompletePlugin />}        */}
        {/* {isEditable && (<ActionsPlugin
          onSave={onSave}
          isRichText={true}
          shouldPreserveNewLinesInMarkdown={shouldPreserveNewLinesInMarkdown}
        />)} */}
      </div>
    </>
  );
}
