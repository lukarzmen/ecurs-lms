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

import {useSettings} from './context/SettingsContext';
import {useSharedHistoryContext} from './context/SharedHistoryContext';
import ActionsPlugin, { SaveResult } from './plugins/ActionsPlugin';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import CollapsiblePlugin from './plugins/CollapsiblePlugin';
import ComponentPickerPlugin from './plugins/ComponentPickerPlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import EmojisPlugin from './plugins/EmojisPlugin';
import EquationsPlugin from './plugins/EquationsPlugin';
import ExcalidrawPlugin from './plugins/ExcalidrawPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import InlineImagePlugin from './plugins/InlineImagePlugin';
import KeywordsPlugin from './plugins/KeywordsPlugin';
import {LayoutPlugin} from './plugins/LayoutPlugin/LayoutPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin';
import MarkdownShortcutPlugin from './plugins/MarkdownShortcutPlugin';
import {MaxLengthPlugin} from './plugins/MaxLengthPlugin';
import MentionsPlugin from './plugins/MentionsPlugin';
import PageBreakPlugin from './plugins/PageBreakPlugin';
import PollPlugin from './plugins/PollPlugin';
import QuizPlugin from './plugins/QuizPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import ContentEditable from './ui/ContentEditable';
import { SerializedDocument } from '@lexical/file';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DictionaryPlugin } from './plugins/DictionaryPlugin';
import { GenerateDictionaryPlugin } from './plugins/GenerateDictionaryPlugin';
import TextGeneratorPlugin from './plugins/TextGeneratorPlugin';
import QuestionAnswerPlugin from './plugins/QuestionAnswerPlugin';
import GapNodePlugin from './plugins/GapPlugin';
import DescriptionPlugin from './plugins/DescriptionPlugin';
import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
import FloatingTextFormatToolbarPlugin from './plugins/FloatingTextFormatToolbarPlugin';
import TranslationPlugin from './plugins/TranslationPlugin';
import AudioPlugin from './plugins/AudioPlugin';
import SpeechToTextPlugin from './plugins/SpeechToTextPlugin';


export default function Editor( {
  onSave,
  onEditorChange,
  isEditable,
}: {
  onSave: (serializedDocument: SerializedDocument) => SaveResult;
  onEditorChange: (editorState: string) => void;
  isEditable: boolean;
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

  useEffect(() => {
    const unregisterListener = editor.registerUpdateListener(({ editorState }) => {
      // Serializuj stan edytora do stringa lub innego formatu
      const serializedState = JSON.stringify(editorState.toJSON());
      onEditorChange(serializedState);
    });
    editor.setEditable(isEditable);
    return () => unregisterListener();
  }, [editor, onEditorChange, isEditable]);
  

  return (
    <>
      {showTableOfContents && <TableOfContentsPlugin />}
      {isEditable && <ToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />}
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
        <HistoryPlugin externalHistoryState={historyState} />        
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor">
                <ContentEditable placeholder={""} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <FloatingTextFormatToolbarPlugin />
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
        <InlineImagePlugin />
        <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
        {/* <PollPlugin /> */}
        <TextGeneratorPlugin />
        <QuizPlugin />
        <GenerateDictionaryPlugin />
        <QuestionAnswerPlugin />
        <DescriptionPlugin />
        <YouTubePlugin />
        <ClickableLinkPlugin disabled={false} />
        <HorizontalRulePlugin />
        <EquationsPlugin />
        <ExcalidrawPlugin />
        <TabFocusPlugin />
        <TabIndentationPlugin />
        <CollapsiblePlugin />
        <PageBreakPlugin />
        <LayoutPlugin />
        
        {/* {isAutocomplete && <AutocompletePlugin />}        */}
        {isEditable && (<ActionsPlugin
          onSave={onSave}
          isRichText={true}
          shouldPreserveNewLinesInMarkdown={shouldPreserveNewLinesInMarkdown}
        />)}
      </div>
    </>
  );
}
