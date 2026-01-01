/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import {
  $isCodeNode,
  getCodeLanguageOptions as getCodeLanguageOptionsPrism,
  normalizeCodeLanguage as normalizeCodeLanguagePrism,
} from '@lexical/code';
import {
  getCodeLanguageOptions as getCodeLanguageOptionsShiki,
  getCodeThemeOptions as getCodeThemeOptionsShiki,
  normalizeCodeLanguage as normalizeCodeLanguageShiki,
} from '@lexical/code-shiki';
import {$isLinkNode, TOGGLE_LINK_COMMAND} from '@lexical/link';
import {$isListNode, ListNode} from '@lexical/list';
import {INSERT_EMBED_COMMAND} from '@lexical/react/LexicalAutoEmbedPlugin';
import {INSERT_HORIZONTAL_RULE_COMMAND} from '@lexical/react/LexicalHorizontalRuleNode';
import {$isHeadingNode} from '@lexical/rich-text';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
} from '@lexical/selection';
import {$isTableNode, $isTableSelection} from '@lexical/table';
import { $generateHtmlFromNodes } from '@lexical/html';
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  IS_APPLE,
  mergeRegister,
} from '@lexical/utils';
import {
  $addUpdateTag,
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CLEAR_EDITOR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  CommandPayloadType,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  HISTORIC_TAG,
  INDENT_CONTENT_COMMAND,
  KEY_MODIFIER_COMMAND,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  SKIP_DOM_SELECTION_TAG,
  SKIP_SELECTION_FOCUS_TAG,
  TextFormatType,
  UNDO_COMMAND,
} from 'lexical';
import {Dispatch, useCallback, useEffect, useState} from 'react';

import {useSettings} from '../../context/SettingsContext';
import {
  blockTypeToBlockName,
  useToolbarState,
} from '../../context/ToolbarContext';
import useModal from '../../hooks/useModal';
import catTypingGif from '../../images/cat-typing.gif';
import {$createStickyNode} from '../../nodes/StickyNode';
import DropDown, {DropDownItem} from '../../ui/DropDown';
import DropdownColorPicker from '../../ui/DropdownColorPicker';
import {isKeyboardInput} from '../../utils/focusUtils';
import {getSelectedNode} from '../../utils/getSelectedNode';
import {sanitizeUrl} from '../../utils/url';
import {EmbedConfigs} from '../AutoEmbedPlugin';
import {INSERT_COLLAPSIBLE_COMMAND} from '../CollapsiblePlugin';
import {InsertEquationDialog} from '../EquationsPlugin';
import {INSERT_EXCALIDRAW_COMMAND} from '../ExcalidrawPlugin';
import {
  INSERT_IMAGE_COMMAND,
  InsertImageDialog,
  InsertImagePayload,
} from '../ImagesPlugin';
import InsertLayoutDialog from '../LayoutPlugin/InsertLayoutDialog';
import {INSERT_PAGE_BREAK} from '../PageBreakPlugin';
import {InsertTableDialog} from '../TablePlugin';
import FontSize, {parseFontSizeForToolbar} from './fontSize';
import Settings from '../../Settings';
import {InsertQuizDialog} from '../QuizPlugin/InsertQuizDialog';
import {GENERATE_DICTIONARY_COMMAND} from '../GenerateDictionaryPlugin';
import {TextGeneratorDialog} from '../TextGeneratorPlugin';
import {QuestionAnswerDialog} from '../QuestionAnswerPlugin/QuestionAnswerDialog';
import {INSERT_GAP_NODE_COMMAND} from '../GapPlugin';
import {INSERT_DEFINITION_NODE_COMMAND} from '../DescriptionPlugin';
import {TranscriptionDialog} from '../AudioPlugin';
import {LanguageSelectorDialog} from '../TranslationPlugin';
import {TextToVoiceDialog} from '../../TextToVoicePlugin';
import {InsertSelectAnswerDialog} from '../SelectAnswerPlugin/InsertSelectAnswerDialog';
import {DoTaskDialog} from '../TaskPlugin/DoTaskDialog';
import {InsertTodoDialog} from '../TodoPlugin/InsertTodoDialog';
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from './utils';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
import { Button } from '@/components/ui/button';


const rootTypeToRootName = {
  root: 'Root',
  table: 'Table',
};

const CODE_LANGUAGE_OPTIONS_PRISM: [string, string][] =
  getCodeLanguageOptionsPrism().filter((option: [string, string]) =>
    [
      'c',
      'clike',
      'cpp',
      'css',
      'html',
      'java',
      'js',
      'javascript',
      'markdown',
      'objc',
      'objective-c',
      'plain',
      'powershell',
      'py',
      'python',
      'rust',
      'sql',
      'swift',
      'typescript',
      'xml',
    ].includes(option[0]),
  );

const CODE_LANGUAGE_OPTIONS_SHIKI: [string, string][] =
  getCodeLanguageOptionsShiki().filter((option: [string, string]) =>
    [
      'c',
      'clike',
      'cpp',
      'css',
      'html',
      'java',
      'js',
      'javascript',
      'markdown',
      'objc',
      'objective-c',
      'plain',
      'powershell',
      'py',
      'python',
      'rust',
      'sql',
      'typescript',
      'xml',
    ].includes(option[0]),
  );

const CODE_THEME_OPTIONS_SHIKI: [string, string][] =
  getCodeThemeOptionsShiki().filter((option: [string, string]) =>
    [
      'catppuccin-latte',
      'everforest-light',
      'github-light',
      'gruvbox-light-medium',
      'kanagawa-lotus',
      'dark-plus',
      'light-plus',
      'material-theme-lighter',
      'min-light',
      'one-light',
      'rose-pine-dawn',
      'slack-ochin',
      'snazzy-light',
      'solarized-light',
      'vitesse-light',
    ].includes(option[0]),
  );

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: {
    icon: string;
    iconRTL: string;
    name: string;
  };
} = {
  center: {
    icon: 'center-align',
    iconRTL: 'center-align',
    name: 'Wycentruj',
  },
  end: {
    icon: 'right-align',
    iconRTL: 'left-align',
    name: 'Do końca',
  },
  justify: {
    icon: 'justify-align',
    iconRTL: 'justify-align',
    name: 'Wyjustuj',
  },
  left: {
    icon: 'left-align',
    iconRTL: 'left-align',
    name: 'Do lewej',
  },
  right: {
    icon: 'right-align',
    iconRTL: 'right-align',
    name: 'Do prawej',
  },
  start: {
    icon: 'left-align',
    iconRTL: 'right-align',
    name: 'Do początku',
  },
};

function dropDownActiveClass(active: boolean) {
  if (active) {
    return 'active dropdown-item-active';
  } else {
    return '';
  }
}

function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  rootType: keyof typeof rootTypeToRootName;
  editor: LexicalEditor;
  disabled?: boolean;
}): JSX.Element {
  return (
    <DropDown
      disabled={disabled}
      buttonClassName="toolbar-item block-controls"
      buttonIconClassName={'icon block-type ' + blockType}
      buttonLabel={blockTypeToBlockName[blockType]}
      buttonAriaLabel="Opcje formatowania stylu tekstu">
      <DropDownItem
        className={
          'item wide ' + dropDownActiveClass(blockType === 'paragraph')
        }
        onClick={() => formatParagraph(editor)}>
        <div className="icon-text-container">
          <i className="icon paragraph" />
          <span className="text">Normalny</span>
        </div>
        <span className="shortcut">{SHORTCUTS.NORMAL}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h1')}
        onClick={() => formatHeading(editor, blockType, 'h1')}>
        <div className="icon-text-container">
          <i className="icon h1" />
          <span className="text">Nagłówek 1</span>
        </div>
        <span className="shortcut">{SHORTCUTS.HEADING1}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h2')}
        onClick={() => formatHeading(editor, blockType, 'h2')}>
        <div className="icon-text-container">
          <i className="icon h2" />
          <span className="text">Nagłówek 2</span>
        </div>
        <span className="shortcut">{SHORTCUTS.HEADING2}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h3')}
        onClick={() => formatHeading(editor, blockType, 'h3')}>
        <div className="icon-text-container">
          <i className="icon h3" />
          <span className="text">Nagłówek 3</span>
        </div>
        <span className="shortcut">{SHORTCUTS.HEADING3}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'number')}
        onClick={() => formatNumberedList(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon numbered-list" />
          <span className="text">Lista numerowana</span>
        </div>
        <span className="shortcut">{SHORTCUTS.NUMBERED_LIST}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'bullet')}
        onClick={() => formatBulletList(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon bullet-list" />
          <span className="text">Lista punktowana</span>
        </div>
        <span className="shortcut">{SHORTCUTS.BULLET_LIST}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'check')}
        onClick={() => formatCheckList(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon check-list" />
          <span className="text">Lista kontrolna</span>
        </div>
        <span className="shortcut">{SHORTCUTS.CHECK_LIST}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'quote')}
        onClick={() => formatQuote(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon quote" />
          <span className="text">Cytat</span>
        </div>
        <span className="shortcut">{SHORTCUTS.QUOTE}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'code')}
        onClick={() => formatCode(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon code" />
          <span className="text">Blok kodu</span>
        </div>
        <span className="shortcut">{SHORTCUTS.CODE_BLOCK}</span>
      </DropDownItem>
    </DropDown>
  );
}

function Divider(): JSX.Element {
  return <div className="divider" />;
}

function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}): JSX.Element {
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style],
  );

  const buttonAriaLabel =
    style === 'font-family'
      ? 'Formatting options for font family'
      : 'Formatting options for font size';

  return (
    <DropDown
      disabled={disabled}
      buttonClassName={'toolbar-item ' + style}
      buttonLabel={value}
      buttonIconClassName={
        style === 'font-family' ? 'icon block-type font-family' : ''
      }
      buttonAriaLabel={buttonAriaLabel}>
      {(style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(
        ([option, text]) => (
          <DropDownItem
            className={`item ${dropDownActiveClass(value === option)} ${
              style === 'font-size' ? 'fontsize-item' : ''
            }`}
            onClick={() => handleClick(option)}
            key={option}>
            <span className="text">{text}</span>
          </DropDownItem>
        ),
      )}
    </DropDown>
  );
}

function ElementFormatDropdown({
  editor,
  value,
  isRTL,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  isRTL: boolean;
  disabled: boolean;
}) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];

  return (
    <DropDown
      disabled={disabled}
      buttonLabel={formatOption.name}
      buttonIconClassName={`icon ${
        isRTL ? formatOption.iconRTL : formatOption.icon
      }`}
      buttonClassName="toolbar-item spaced alignment"
      buttonAriaLabel="Opcje formatowania wyrównania tekstu">
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className="icon left-align" />
          <span className="text">Do lewej</span>
        </div>
        <span className="shortcut">{SHORTCUTS.LEFT_ALIGN}</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className="icon center-align" />
          <span className="text">Wyśrodkuj</span>
        </div>
        <span className="shortcut">{SHORTCUTS.CENTER_ALIGN}</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className="icon right-align" />
          <span className="text">Do prawej</span>
        </div>
        <span className="shortcut">{SHORTCUTS.RIGHT_ALIGN}</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className="icon justify-align" />
          <span className="text">Wyjustuj</span>
        </div>
        <span className="shortcut">{SHORTCUTS.JUSTIFY_ALIGN}</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'start');
        }}
        className="item wide">
        <i
          className={`icon ${
            isRTL
              ? ELEMENT_FORMAT_OPTIONS.start.iconRTL
              : ELEMENT_FORMAT_OPTIONS.start.icon
          }`}
        />
        <span className="text">Do początku</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'end');
        }}
        className="item wide">
        <i
          className={`icon ${
            isRTL
              ? ELEMENT_FORMAT_OPTIONS.end.iconRTL
              : ELEMENT_FORMAT_OPTIONS.end.icon
          }`}
        />
        <span className="text">Do końca</span>
      </DropDownItem>
      <Divider />
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className={'icon ' + (isRTL ? 'indent' : 'outdent')} />
          <span className="text">Zmniejsz wcięcie</span>
        </div>
        <span className="shortcut">{SHORTCUTS.OUTDENT}</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className={'icon ' + (isRTL ? 'outdent' : 'indent')} />
          <span className="text">Zwiększ wcięcie</span>
        </div>
        <span className="shortcut">{SHORTCUTS.INDENT}</span>
      </DropDownItem>
    </DropDown>
  );
}

function $findTopLevelElement(node: LexicalNode) {
  let topLevelElement =
    node.getKey() === 'root'
      ? node
      : $findMatchingParent(node, (e) => {
          const parent = e.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        });

  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }
  return topLevelElement;
}

export default function NewToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
  onSave
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<LexicalEditor>;
  setIsLinkEditMode: Dispatch<boolean>;
  onSave: () => void;
}): JSX.Element {
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null,
  );
  const [modal, showModal] = useModal();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const {toolbarState, updateToolbarState} = useToolbarState();

  const dispatchToolbarCommand = <T extends LexicalCommand<unknown>>(
    command: T,
    payload: CommandPayloadType<T> | undefined = undefined,
    skipRefocus: boolean = false,
  ) => {
    activeEditor.update(() => {
      if (skipRefocus) {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
      }

      // Re-assert on Type so that payload can have a default param
      activeEditor.dispatchCommand(command, payload as CommandPayloadType<T>);
    });
  };

  const dispatchFormatTextCommand = (
    payload: TextFormatType,
    skipRefocus: boolean = false,
  ) => dispatchToolbarCommand(FORMAT_TEXT_COMMAND, payload, skipRefocus);

  const $handleHeadingNode = useCallback(
    (selectedElement: LexicalNode) => {
      const type = $isHeadingNode(selectedElement)
        ? selectedElement.getTag()
        : selectedElement.getType();

      if (type in blockTypeToBlockName) {
        updateToolbarState(
          'blockType',
          type as keyof typeof blockTypeToBlockName,
        );
      }
    },
    [updateToolbarState],
  );

  const {
    settings: {isCodeHighlighted, isCodeShiki},
  } = useSettings();

  const $handleCodeNode = useCallback(
    (element: LexicalNode) => {
      if ($isCodeNode(element)) {
        const language = element.getLanguage();
        updateToolbarState(
          'codeLanguage',
          language
            ? (isCodeHighlighted &&
                (isCodeShiki
                  ? normalizeCodeLanguageShiki(language)
                  : normalizeCodeLanguagePrism(language))) ||
                language
            : '',
        );
        const theme = element.getTheme();
        updateToolbarState('codeTheme', theme || '');
        return;
      }
    },
    [updateToolbarState, isCodeHighlighted, isCodeShiki],
  );

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          'isImageCaption',
          !!rootElement?.parentElement?.classList.contains(
            'image-caption-container',
          ),
        );
      } else {
        updateToolbarState('isImageCaption', false);
      }

      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      updateToolbarState('isRTL', $isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState('isLink', isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState('rootType', 'table');
      } else {
        updateToolbarState('rootType', 'root');
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();

          updateToolbarState('blockType', type);
        } else {
          $handleHeadingNode(element);
          $handleCodeNode(element);
        }
      }

      // Handle buttons
      updateToolbarState(
        'fontColor',
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      updateToolbarState(
        'bgColor',
        $getSelectionStyleValueForProperty(
          selection,
          'background-color',
          '#fff',
        ),
      );
      updateToolbarState(
        'fontFamily',
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        );
      }

      // If matchingParent is a valid node, pass it's format type
      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // Update text format
      updateToolbarState('isBold', selection.hasFormat('bold'));
      updateToolbarState('isItalic', selection.hasFormat('italic'));
      updateToolbarState('isUnderline', selection.hasFormat('underline'));
      updateToolbarState(
        'isStrikethrough',
        selection.hasFormat('strikethrough'),
      );
      updateToolbarState('isSubscript', selection.hasFormat('subscript'));
      updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
      updateToolbarState('isHighlight', selection.hasFormat('highlight'));
      updateToolbarState('isCode', selection.hasFormat('code'));
      updateToolbarState(
        'fontSize',
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
      updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
      updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
    }
    if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = $getNearestNodeOfType<ListNode>(
          selectedNode,
          ListNode,
        );
        if (parentList) {
          const type = parentList.getListType();
          updateToolbarState('blockType', type);
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);
          $handleCodeNode(selectedElement);
          // Update elementFormat for node selection (e.g., images)
          if ($isElementNode(selectedElement)) {
            updateToolbarState(
              'elementFormat',
              selectedElement.getFormatType(),
            );
          }
        }
      }
    }
  }, [
    activeEditor,
    editor,
    updateToolbarState,
    $handleHeadingNode,
    $handleCodeNode,
  ]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(
      () => {
        $updateToolbar();
      },
      {editor: activeEditor},
    );
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({editorState}) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          {editor: activeEditor},
        );
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState('canUndo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState('canRedo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);

  useEffect(() => {
    return activeEditor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (payload) => {
        const event: KeyboardEvent = payload;
        const { code, ctrlKey, metaKey } = event;

        if (code === 'KeyK' && (ctrlKey || metaKey)) {
          event.preventDefault();
          let url: string | null;
          if (!toolbarState.isLink) {
            setIsLinkEditMode(true);
            url = sanitizeUrl('https://');
          } else {
            setIsLinkEditMode(false);
            url = null;
          }
          return activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL,
    );
  }, [activeEditor, toolbarState.isLink, setIsLinkEditMode]);

  useEffect(() => {
    return editor.registerUpdateListener(
      () => {
        // If we are in read only mode, send the editor state
        // to server and ask for validation if possible.
        editor.getEditorState().read(() => {
          const root = $getRoot();
          const children = root.getChildren();

          if (children.length > 1) {
            setIsEditorEmpty(false);
          } else {
            if ($isParagraphNode(children[0])) {
              const paragraphChildren = children[0].getChildren();
              setIsEditorEmpty(paragraphChildren.length === 0);
            } else {
              setIsEditorEmpty(false);
            }
          }
        });
      },
    );
  }, [editor, isEditable]);

  const applyStyleText = useCallback(
    (
      styles: Record<string, string>,
      skipHistoryStack?: boolean,
      skipRefocus: boolean = false,
    ) => {
      activeEditor.update(
        () => {
          if (skipRefocus) {
            $addUpdateTag(SKIP_DOM_SELECTION_TAG);
          }
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? {tag: HISTORIC_TAG} : {},
      );
    },
    [activeEditor],
  );

  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText({color: value}, skipHistoryStack);
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText(
        {'background-color': value},
        skipHistoryStack,
      );
    },
    [applyStyleText],
  );

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(
        TOGGLE_LINK_COMMAND,
        sanitizeUrl('https://'),
      );
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );
  const onCodeThemeSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setTheme(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );

  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;

  const getHtmlFromEditor = useCallback((): string => {
    let html = '';
    activeEditor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(activeEditor, null);
    });
    return html;
  }, [activeEditor]);

  const exportHtml = useCallback(() => {
    const bodyHtml = getHtmlFromEditor();
    const htmlDocument = `<!doctype html><html lang="pl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Eksport</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}img{max-width:100%;height:auto;}</style></head><body>${bodyHtml}</body></html>`;

    const blob = new Blob([htmlDocument], {type: 'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modul.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [getHtmlFromEditor]);

  const exportPdf = useCallback(() => {
    const bodyHtml = getHtmlFromEditor();
    const htmlDocument = `<!doctype html><html lang="pl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Eksport PDF</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}img{max-width:100%;height:auto;}</style></head><body>${bodyHtml}</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    const cleanup = () => {
      try {
        iframe.remove();
      } catch {
        // ignore
      }
    };

    iframe.onload = () => {
      const w = iframe.contentWindow;
      if (!w) {
        cleanup();
        return;
      }

      w.addEventListener('afterprint', cleanup, {once: true});
      setTimeout(cleanup, 60_000);

      w.focus();
      w.print();
    };

    iframe.srcdoc = htmlDocument;
    document.body.appendChild(iframe);
  }, [getHtmlFromEditor]);

  return (
    <div className="toolbar">
      <button
        disabled={!isEditable}
        onClick={() => onSave()}
        title="Zapisz"
        type="button"
        className="toolbar-item spaced"
        aria-label="Zapisz">
        <i className="format save" />
      </button>
      <button
        disabled={!toolbarState.canUndo || !isEditable}
        onClick={(e) =>
          dispatchToolbarCommand(UNDO_COMMAND, undefined, isKeyboardInput(e))
        }
        title={IS_APPLE ? 'Cofnij (⌘Z)' : 'Cofnij (Ctrl+Z)'}
        type="button"
        className="toolbar-item spaced"
        aria-label="Cofnij">
        <i className="format undo" />
      </button>
      <button
        disabled={!toolbarState.canRedo || !isEditable}
        onClick={(e) =>
          dispatchToolbarCommand(REDO_COMMAND, undefined, isKeyboardInput(e))
        }
        title={IS_APPLE ? 'Ponów (⇧⌘Z)' : 'Ponów (Ctrl+Y)'}
        type="button"
        className="toolbar-item"
        aria-label="Ponów">
        <i className="format redo" />
      </button>
      <Divider />
      {toolbarState.blockType in blockTypeToBlockName &&
        activeEditor === editor && (
          <>
            <BlockFormatDropDown
              disabled={!isEditable}
              blockType={toolbarState.blockType}
              rootType={toolbarState.rootType}
              editor={activeEditor}
            />
            <Divider />
          </>
        )}
      {toolbarState.blockType === 'code' && isCodeHighlighted ? (
        <>
          {!isCodeShiki && (
            <DropDown
              disabled={!isEditable}
              buttonClassName="toolbar-item code-language"
              buttonLabel={
                (CODE_LANGUAGE_OPTIONS_PRISM.find(
                  (opt) =>
                    opt[0] ===
                    normalizeCodeLanguagePrism(toolbarState.codeLanguage),
                ) || ['', ''])[1]
              }
              buttonAriaLabel="Select language">
              {CODE_LANGUAGE_OPTIONS_PRISM.map(([value, name]) => {
                return (
                  <DropDownItem
                    className={`item ${dropDownActiveClass(
                      value === toolbarState.codeLanguage,
                    )}`}
                    onClick={() => onCodeLanguageSelect(value)}
                    key={value}>
                    <span className="text">{name}</span>
                  </DropDownItem>
                );
              })}
            </DropDown>
          )}
          {isCodeShiki && (
            <>
              <DropDown
                disabled={!isEditable}
                buttonClassName="toolbar-item code-language"
                buttonLabel={
                  (CODE_LANGUAGE_OPTIONS_SHIKI.find(
                    (opt) =>
                      opt[0] ===
                      normalizeCodeLanguageShiki(toolbarState.codeLanguage),
                  ) || ['', ''])[1]
                }
                buttonAriaLabel="Select language">
                {CODE_LANGUAGE_OPTIONS_SHIKI.map(([value, name]) => {
                  return (
                    <DropDownItem
                      className={`item ${dropDownActiveClass(
                        value === toolbarState.codeLanguage,
                      )}`}
                      onClick={() => onCodeLanguageSelect(value)}
                      key={value}>
                      <span className="text">{name}</span>
                    </DropDownItem>
                  );
                })}
              </DropDown>
              <DropDown
                disabled={!isEditable}
                buttonClassName="toolbar-item code-language"
                buttonLabel={
                  (CODE_THEME_OPTIONS_SHIKI.find(
                    (opt) => opt[0] === toolbarState.codeTheme,
                  ) || ['', ''])[1]
                }
                buttonAriaLabel="Select theme">
                {CODE_THEME_OPTIONS_SHIKI.map(([value, name]) => {
                  return (
                    <DropDownItem
                      className={`item ${dropDownActiveClass(
                        value === toolbarState.codeTheme,
                      )}`}
                      onClick={() => onCodeThemeSelect(value)}
                      key={value}>
                      <span className="text">{name}</span>
                    </DropDownItem>
                  );
                })}
              </DropDown>
            </>
          )}
        </>
      ) : (
        <>
          <FontDropDown
            disabled={!isEditable}
            style={'font-family'}
            value={toolbarState.fontFamily}
            editor={activeEditor}
          />
          <Divider />
          <FontSize
            selectionFontSize={parseFontSizeForToolbar(
              toolbarState.fontSize,
            ).slice(0, -2)}
            editor={activeEditor}
            disabled={!isEditable}
          />
          <Divider />
          <button
            disabled={!isEditable}
            onClick={(e) =>
              dispatchFormatTextCommand('bold', isKeyboardInput(e))
            }
            className={
              'toolbar-item spaced ' + (toolbarState.isBold ? 'active' : '')
            }
            title={`Pogrubienie (${SHORTCUTS.BOLD})`}
            type="button"
            aria-label={`Pogrubienie. Skrót: ${SHORTCUTS.BOLD}`}>
            <i className="format bold" />
          </button>
          <button
            disabled={!isEditable}
            onClick={(e) =>
              dispatchFormatTextCommand('italic', isKeyboardInput(e))
            }
            className={
              'toolbar-item spaced ' + (toolbarState.isItalic ? 'active' : '')
            }
            title={`Kursywa (${SHORTCUTS.ITALIC})`}
            type="button"
            aria-label={`Kursywa. Skrót: ${SHORTCUTS.ITALIC}`}>
            <i className="format italic" />
          </button>
          <button
            disabled={!isEditable}
            onClick={(e) =>
              dispatchFormatTextCommand('underline', isKeyboardInput(e))
            }
            className={
              'toolbar-item spaced ' +
              (toolbarState.isUnderline ? 'active' : '')
            }
            title={`Podkreślenie (${SHORTCUTS.UNDERLINE})`}
            type="button"
            aria-label={`Podkreślenie. Skrót: ${SHORTCUTS.UNDERLINE}`}>
            <i className="format underline" />
          </button>
          {canViewerSeeInsertCodeButton && (
            <button
              disabled={!isEditable}
              onClick={(e) =>
                dispatchFormatTextCommand('code', isKeyboardInput(e))
              }
              className={
                'toolbar-item spaced ' + (toolbarState.isCode ? 'active' : '')
              }
              title={`Wstaw blok kodu (${SHORTCUTS.INSERT_CODE_BLOCK})`}
              type="button"
              aria-label="Wstaw blok kodu">
              <i className="format code" />
            </button>
          )}
          <button
            disabled={!isEditable}
            onClick={insertLink}
            className={
              'toolbar-item spaced ' + (toolbarState.isLink ? 'active' : '')
            }
            aria-label="Wstaw link"
            title={`Wstaw link (${SHORTCUTS.INSERT_LINK})`}
            type="button">
            <i className="format link" />
          </button>
          <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel="Formatting text color"
            buttonIconClassName="icon font-color"
            color={toolbarState.fontColor}
            onChange={onFontColorSelect}
            title="Kolor tekstu"
          />
          <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel="Formatting background color"
            buttonIconClassName="icon bg-color"
            color={toolbarState.bgColor}
            onChange={onBgColorSelect}
            title="Kolor tła"
          />
          <DropDown
            disabled={!isEditable}
            buttonClassName="toolbar-item spaced"
            buttonLabel=""
            buttonAriaLabel="Formatting options for additional text styles"
            buttonIconClassName="icon dropdown-more">
            {/* <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('lowercase', isKeyboardInput(e))
              }
              className={
                'item wide ' + dropDownActiveClass(toolbarState.isLowercase)
              }
              title="Małe litery"
              aria-label="Formatuj tekst na małe litery">
              <div className="icon-text-container">
                <i className="icon lowercase" />
                <span className="text">Małe litery</span>
              </div>
              <span className="shortcut">{SHORTCUTS.LOWERCASE}</span>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('uppercase', isKeyboardInput(e))
              }
              className={
                'item wide ' + dropDownActiveClass(toolbarState.isUppercase)
              }
              title="Wielkie litery"
              aria-label="Formatuj tekst na wielkie litery">
              <div className="icon-text-container">
                <i className="icon uppercase" />
                <span className="text">WIELKIE LITERY</span>
              </div>
              <span className="shortcut">{SHORTCUTS.UPPERCASE}</span>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('capitalize', isKeyboardInput(e))
              }
              className={
                'item wide ' + dropDownActiveClass(toolbarState.isCapitalize)
              }
              title="Wielkie pierwsze litery"
              aria-label="Formatuj pierwsze litery słów na wielkie">
              <div className="icon-text-container">
                <i className="icon capitalize" />
                <span className="text">Wielkie Pierwsze</span>
              </div>
              <span className="shortcut">{SHORTCUTS.CAPITALIZE}</span>
            </DropDownItem> */}
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('strikethrough', isKeyboardInput(e))
              }
              className={
                'item wide ' + dropDownActiveClass(toolbarState.isStrikethrough)
              }
              title="Przekreślenie"
              aria-label="Przekreśl tekst">
              <div className="icon-text-container">
                <i className="icon strikethrough" />
                <span className="text">Przekreślenie</span>
              </div>
              <span className="shortcut">{SHORTCUTS.STRIKETHROUGH}</span>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('subscript', isKeyboardInput(e))
              }
              className={
                'item wide ' + dropDownActiveClass(toolbarState.isSubscript)
              }
              title="Indeks dolny"
              aria-label="Formatuj tekst jako indeks dolny">
              <div className="icon-text-container">
                <i className="icon subscript" />
                <span className="text">Indeks dolny</span>
              </div>
              <span className="shortcut">{SHORTCUTS.SUBSCRIPT}</span>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('superscript', isKeyboardInput(e))
              }
              className={
                'item wide ' + dropDownActiveClass(toolbarState.isSuperscript)
              }
              title="Indeks górny"
              aria-label="Formatuj tekst jako indeks górny">
              <div className="icon-text-container">
                <i className="icon superscript" />
                <span className="text">Indeks górny</span>
              </div>
              <span className="shortcut">{SHORTCUTS.SUPERSCRIPT}</span>
            </DropDownItem>
            <DropDownItem
              onClick={(e) =>
                dispatchFormatTextCommand('highlight', isKeyboardInput(e))
              }
              className={
                'item wide ' + dropDownActiveClass(toolbarState.isHighlight)
              }
              title="Highlight"
              aria-label="Format text with a highlight">
              <div className="icon-text-container">
                <i className="icon highlight" />
                <span className="text">Podświetlenie</span>
              </div>
            </DropDownItem>
            <DropDownItem
              onClick={(e) => clearFormatting(activeEditor, isKeyboardInput(e))}
              className="item wide"
              title="Clear text formatting"
              aria-label="Clear all text formatting">
              <div className="icon-text-container">
                <i className="icon clear" />
                <span className="text">Wyczyść formatowanie</span>
              </div>
              <span className="shortcut">{SHORTCUTS.CLEAR_FORMATTING}</span>
            </DropDownItem>
          </DropDown>
          {canViewerSeeInsertDropdown && (
            <>
              <Divider />
              <DropDown
                disabled={!isEditable}
                buttonClassName="toolbar-item spaced"
                buttonLabel="Wstaw"
                buttonAriaLabel="Wstaw specjalny element"
                buttonIconClassName="icon plus">
                <DropDownItem
                  onClick={() => {
                    showModal('Wstaw obraz', (onClose) => (
                      <InsertImageDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon image" />
                  <span className="text">Obraz</span>
                </DropDownItem>
                {/* <DropDownItem
                  onClick={() =>
                    dispatchToolbarCommand(INSERT_EXCALIDRAW_COMMAND)
                  }
                  className="item">
                  <i className="icon diagram-2" />
                  <span className="text">Excalidraw</span>
                </DropDownItem> */}
                <DropDownItem
                  onClick={() => {
                    showModal('Wstaw audio', (onClose) => (
                      <TranscriptionDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon audio" />
                  <span className="text">Audio</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal('Wstaw tabelę', (onClose) => (
                      <InsertTableDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon table" />
                  <span className="text">Tabela</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal('Wstaw układ kolumnowy', (onClose) => (
                      <InsertLayoutDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon columns" />
                  <span className="text">Układ kolumnowy</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal('Wstaw równanie', (onClose) => (
                      <InsertEquationDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon equation" />
                  <span className="text">Równanie</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    editor.update(() => {
                      $addUpdateTag(SKIP_SELECTION_FOCUS_TAG);
                      const root = $getRoot();
                      const stickyNode = $createStickyNode(0, 0);
                      root.append(stickyNode);
                    });
                  }}
                  className="item">
                  <i className="icon sticky" />
                  <span className="text">Notatka</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() =>
                    dispatchToolbarCommand(INSERT_COLLAPSIBLE_COMMAND)
                  }
                  className="item">
                  <i className="icon caret-right" />
                  <span className="text">Kontener zwijany</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() =>
                    dispatchToolbarCommand(INSERT_HORIZONTAL_RULE_COMMAND)
                  }
                  className="item">
                  <i className="icon horizontal-rule" />
                  <span className="text">Linia pozioma</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => dispatchToolbarCommand(INSERT_PAGE_BREAK)}
                  className="item">
                  <i className="icon page-break" />
                  <span className="text">Podział strony</span>
                </DropDownItem>
                {EmbedConfigs.map((embedConfig) => (
                  <DropDownItem
                    key={embedConfig.type}
                    onClick={() =>
                      dispatchToolbarCommand(
                        INSERT_EMBED_COMMAND,
                        embedConfig.type,
                      )
                    }
                    className="item">
                    {embedConfig.icon}
                    <span className="text">{embedConfig.contentName}</span>
                  </DropDownItem>
                ))}
              </DropDown>
            </>
          )}
        </>
      )}
      <Divider />
      <ElementFormatDropdown
        disabled={!isEditable}
        value={toolbarState.elementFormat}
        editor={activeEditor}
        isRTL={toolbarState.isRTL}
      />
      <Divider />
      <DropDown
        disabled={!isEditable}
        buttonClassName="toolbar-item spaced"
        buttonLabel="Narzędzia"
        buttonAriaLabel="Opcje kursu"
        buttonIconClassName="icon dropdown-course">
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(GENERATE_DICTIONARY_COMMAND, "");
          }}
          className="item">
          <i className="icon dictionary" />
          <span className="text">Słownik</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(INSERT_GAP_NODE_COMMAND, "");
          }}
          className="item">
          <i className="icon fillgap" />
          <span className="text">Luka</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal('Generuj test', (onClose) => (
              <InsertQuizDialog activeEditor={activeEditor} onClose={onClose} />
            ));
          }}
          className="item">
          <i className="icon quiz" />
          <span className="text">Quiz</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(INSERT_DEFINITION_NODE_COMMAND, "");
          }}
          className="item">
          <i className="icon plus" />
          <span className="text">Wytłumaczenie</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal('Wybierz odpowiedź', (onClose) => (
              <InsertSelectAnswerDialog activeEditor={activeEditor} onClose={onClose} />
            ));
          }}
          className="item">
          <i className="icon multi-select-checkbox" />
          <span className="text">Lista wybierana</span>
        </DropDownItem>
          <DropDownItem
          onClick={() => {
            showModal('Lista wybierana', (onClose) => (
              <InsertTodoDialog activeEditor={activeEditor} onClose={onClose} />
            ));
          }}
          className="item">
          <i className="icon select-checkbox" />
          <span className="text">Zadania domowe</span>
        </DropDownItem>
      </DropDown>
      <Divider />
      <DropDown
        disabled={!isEditable}
        buttonClassName="toolbar-item spaced"
        buttonLabel="AI"
        buttonAriaLabel="Opcje AI"
        buttonIconClassName="icon ai">
        <DropDownItem
          onClick={() => {
            showModal('Generuj treść', (onClose) => (
              <TextGeneratorDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon generate-text" />
          <span className="text">Treść</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal('Tłumacz', (onClose) => (
              <LanguageSelectorDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon language" />
          <span className="text">Tłumacz</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal('Zadanie', (onClose) => (
              <DoTaskDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon task" />
          <span className="text">Zadanie</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal('Wstaw pytanie i odpowiedź', (onClose) => (
              <QuestionAnswerDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon question" />
          <span className="text">Pytanie - odpowiedź</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal('Tekst na mowę', (onClose) => (
              <TextToVoiceDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon audio" />
          <span className="text">Tekst na mowę</span>
        </DropDownItem>
      </DropDown>
      <Divider />
      <DropDown
        disabled={!isEditable}
        buttonClassName="toolbar-item spaced"
        buttonLabel="Pobierz"
        buttonAriaLabel="Pobierz"
        buttonIconClassName="icon download">
        <DropDownItem onClick={exportHtml} className="item">
          <i className="icon html" />
          <span className="text">HTML</span>
        </DropDownItem>
        <DropDownItem onClick={exportPdf} className="item">
          <i className="icon pdf" />
          <span className="text">PDF</span>
        </DropDownItem>
      </DropDown>
      <button
        className="toolbar-item spaced"
        disabled={isEditorEmpty}
        onClick={() => {
          showModal('Wyczyść edytor', (onClose) => (
            <ShowClearDialog editor={editor} onClose={onClose} />
          ));
        }}
        title="Wyczyść"
        aria-label="Wyczyść edytor">
        <i className="format clear" />
      </button>
      <Settings />
      {modal}
    </div>
  );
}

function ShowClearDialog({
  editor,
  onClose,
}: {
  editor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  return (
    <>
      Czy na pewno chcesz wyczyścić obszar roboczy?
      <div className="Modal__content">
        <Button
          onClick={() => {
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            editor.focus();
            onClose();
          }}>
          Wyczyść
        </Button>{' '}
        <Button
          variant="secondary"
          onClick={() => {
            onClose();
          }}>
          Anuluj
        </Button>
      </div>
    </>
  );
}
