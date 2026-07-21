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
import {useCourseContext} from '../../context/CourseContext';
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
import {InsertOrderingDialog} from '../OrderingPlugin/InsertOrderingDialog';
import {InsertTrueFalseDialog} from '../TrueFalsePlugin/InsertTrueFalseDialog';
import {LessonBuilderDialog} from '../LessonBuilderPlugin/LessonBuilderDialog';
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
import {useI18n} from '@/hooks/use-i18n';


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
    name: 'ed.alignCenter',
  },
  end: {
    icon: 'right-align',
    iconRTL: 'left-align',
    name: 'ed.alignEnd',
  },
  justify: {
    icon: 'justify-align',
    iconRTL: 'justify-align',
    name: 'ed.alignJustify',
  },
  left: {
    icon: 'left-align',
    iconRTL: 'left-align',
    name: 'ed.alignLeft',
  },
  right: {
    icon: 'right-align',
    iconRTL: 'right-align',
    name: 'ed.alignRight',
  },
  start: {
    icon: 'left-align',
    iconRTL: 'right-align',
    name: 'ed.alignStart',
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
  const { t } = useI18n();
  return (
    <DropDown
      disabled={disabled}
      buttonClassName="toolbar-item block-controls"
      buttonIconClassName={'icon block-type ' + blockType}
      buttonLabel={t(blockTypeToBlockName[blockType])}
      buttonAriaLabel={t('ed.blockOptions')}>
      <DropDownItem
        className={
          'item wide ' + dropDownActiveClass(blockType === 'paragraph')
        }
        onClick={() => formatParagraph(editor)}>
        <div className="icon-text-container">
          <i className="icon paragraph" />
          <span className="text">{t('ed.normalText')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.NORMAL}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h1')}
        onClick={() => formatHeading(editor, blockType, 'h1')}>
        <div className="icon-text-container">
          <i className="icon h1" />
          <span className="text">{t('ed.blockH1')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.HEADING1}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h2')}
        onClick={() => formatHeading(editor, blockType, 'h2')}>
        <div className="icon-text-container">
          <i className="icon h2" />
          <span className="text">{t('ed.blockH2')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.HEADING2}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'h3')}
        onClick={() => formatHeading(editor, blockType, 'h3')}>
        <div className="icon-text-container">
          <i className="icon h3" />
          <span className="text">{t('ed.blockH3')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.HEADING3}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'number')}
        onClick={() => formatNumberedList(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon numbered-list" />
          <span className="text">{t('ed.blockNumber')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.NUMBERED_LIST}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'bullet')}
        onClick={() => formatBulletList(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon bullet-list" />
          <span className="text">{t('ed.blockBullet')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.BULLET_LIST}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'check')}
        onClick={() => formatCheckList(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon check-list" />
          <span className="text">{t('ed.blockCheck')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.CHECK_LIST}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'quote')}
        onClick={() => formatQuote(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon quote" />
          <span className="text">{t('ed.blockQuote')}</span>
        </div>
        <span className="shortcut">{SHORTCUTS.QUOTE}</span>
      </DropDownItem>
      <DropDownItem
        className={'item wide ' + dropDownActiveClass(blockType === 'code')}
        onClick={() => formatCode(editor, blockType)}>
        <div className="icon-text-container">
          <i className="icon code" />
          <span className="text">{t('ed.blockCode')}</span>
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
  const { t } = useI18n();
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];

  return (
    <DropDown
      disabled={disabled}
      buttonLabel={t(formatOption.name)}
      buttonIconClassName={`icon ${
        isRTL ? formatOption.iconRTL : formatOption.icon
      }`}
      buttonClassName="toolbar-item spaced alignment"
      buttonAriaLabel={t('ed.alignOptions')}>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className="icon left-align" />
          <span className="text">{t('ed.alignLeft')}</span>
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
          <span className="text">{t('ed.alignCenter')}</span>
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
          <span className="text">{t('ed.alignRight')}</span>
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
          <span className="text">{t('ed.alignJustify')}</span>
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
        <span className="text">{t('ed.alignStart')}</span>
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
        <span className="text">{t('ed.alignEnd')}</span>
      </DropDownItem>
      <Divider />
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        }}
        className="item wide">
        <div className="icon-text-container">
          <i className={'icon ' + (isRTL ? 'indent' : 'outdent')} />
          <span className="text">{t('ed.outdent')}</span>
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
          <span className="text">{t('ed.indent')}</span>
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
  const {module} = useCourseContext();
  const { t } = useI18n();

  const generateFileName = useCallback(() => {
    if (module?.courseName && module?.moduleName) {
      const sanitize = (str: string) => str.replace(/[^a-z0-9_-]/gi, '_');
      return `${sanitize(module.courseName)}_${sanitize(module.moduleName)}`;
    }
    return 'modul';
  }, [module]);

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
    void (async () => {
      const bodyHtml = getHtmlFromEditor();
      const fileName = generateFileName();

      const wrapper = document.createElement('div');
      wrapper.innerHTML = bodyHtml;

      const qrImgs = Array.from(
        wrapper.querySelectorAll('img[data-youtube-qr]'),
      ) as HTMLImageElement[];

      if (qrImgs.length > 0) {
        try {
          const QRCodeModule = await import('qrcode');
          const toDataURL: undefined | ((text: string, opts?: any) => Promise<string>) =
            (QRCodeModule as any).toDataURL ?? (QRCodeModule as any).default?.toDataURL;

          if (typeof toDataURL === 'function') {
            await Promise.all(
              qrImgs.map(async (img) => {
                const url = img.getAttribute('data-youtube-qr');
                if (!url) return;
                try {
                  const dataUrl = await toDataURL(url, {
                    width: 256,
                    margin: 1,
                  });
                  img.src = dataUrl;
                  img.style.display = 'block';
                } catch {
                  // ignore
                }
              }),
            );
          }
        } catch {
          // ignore
        }
      }

      const processedHtml = wrapper.innerHTML;

      const htmlDocument = `<!doctype html><html lang="pl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${fileName}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}img{max-width:100%;height:auto;}table{width:100%;margin:12px 0;border:1px solid rgba(0,0,0,0.15);border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;}th,td{padding:8px 10px;vertical-align:top;border-right:1px solid rgba(0,0,0,0.12);border-bottom:1px solid rgba(0,0,0,0.12);}th:last-child,td:last-child{border-right:0;}tr:last-child td{border-bottom:0;}th{background:rgba(0,0,0,0.06);font-weight:700;text-align:left;}tbody tr:nth-child(even) td{background:rgba(0,0,0,0.02);}</style></head><body>${processedHtml}</body></html>`;

      const blob = new Blob([htmlDocument], {type: 'text/html;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generateFileName()}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })();
  }, [getHtmlFromEditor, generateFileName]);

  const exportPdf = useCallback(() => {
    void (async () => {
      const bodyHtml = getHtmlFromEditor();
      const fileName = generateFileName();

      const wrapper = document.createElement('div');
      wrapper.innerHTML = bodyHtml;

      const qrImgs = Array.from(
        wrapper.querySelectorAll('img[data-youtube-qr]'),
      ) as HTMLImageElement[];

      if (qrImgs.length > 0) {
        try {
          const QRCodeModule = await import('qrcode');
          const toDataURL: undefined | ((text: string, opts?: any) => Promise<string>) =
            (QRCodeModule as any).toDataURL ?? (QRCodeModule as any).default?.toDataURL;

          if (typeof toDataURL !== 'function') {
            throw new Error('qrcode: toDataURL not found');
          }
          await Promise.all(
            qrImgs.map(async (img) => {
              const url = img.getAttribute('data-youtube-qr');
              if (!url) return;
              try {
                const dataUrl = await toDataURL(url, {
                  width: 256,
                  margin: 1,
                });
                img.src = dataUrl;
                img.style.display = 'block';
              } catch {
                // If QR generation fails, keep the link text as fallback.
              }
            }),
          );
        } catch {
          // ignore
        }
      }

      // Hide YouTube iframes in print/PDF to avoid large blank spaces.
      const iframes = Array.from(
        wrapper.querySelectorAll('iframe[data-lexical-youtube]'),
      ) as HTMLIFrameElement[];
      for (const iframe of iframes) {
        iframe.style.display = 'none';
        iframe.style.height = '0';
      }

      const processedHtml = wrapper.innerHTML;

      const htmlDocument = `<!doctype html><html lang="pl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${fileName}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;}img{max-width:100%;height:auto;}table{width:100%;margin:12px 0;border:1px solid rgba(0,0,0,0.15);border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;}th,td{padding:8px 10px;vertical-align:top;border-right:1px solid rgba(0,0,0,0.12);border-bottom:1px solid rgba(0,0,0,0.12);}th:last-child,td:last-child{border-right:0;}tr:last-child td{border-bottom:0;}th{background:rgba(0,0,0,0.06);font-weight:700;text-align:left;}tbody tr:nth-child(even) td{background:rgba(0,0,0,0.02);}@media print{body{margin:0;}iframe[data-lexical-youtube]{display:none!important;}}</style></head><body>${processedHtml}<script>window.addEventListener('load',()=>{setTimeout(()=>{try{window.focus();window.print();}catch(e){}},0)},{once:true});</script></body></html>`;

      const isProbablyMobile =
      (typeof window !== 'undefined' &&
        (window.matchMedia?.('(pointer:coarse)').matches ||
          navigator.maxTouchPoints > 0)) ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Mobile browsers often ignore iframe printing and print the whole current page.
    // Opening a standalone document is more reliable.
      if (isProbablyMobile) {
      const blob = new Blob([htmlDocument], {type: 'text/html;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (!w) {
        window.location.href = url;
        return;
      }

      const cleanup = () => {
        try { URL.revokeObjectURL(url); } catch {}
      };
      w.addEventListener('pagehide', cleanup, {once: true});
      setTimeout(cleanup, 60_000);
      return;
      }

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
    })();
  }, [getHtmlFromEditor, generateFileName]);

  return (
    <div className="toolbar">
      <button
        disabled={!isEditable}
        onClick={() => onSave()}
        title={t('ed.save')}
        type="button"
        className="toolbar-item spaced"
        aria-label={t('ed.save')}>
        <i className="format save" />
      </button>
      <button
        disabled={!toolbarState.canUndo || !isEditable}
        onClick={(e) =>
          dispatchToolbarCommand(UNDO_COMMAND, undefined, isKeyboardInput(e))
        }
        title={IS_APPLE ? t('ed.undoMac') : t('ed.undoWin')}
        type="button"
        className="toolbar-item spaced"
        aria-label={t('ed.undoWin').replace(/\s*\(.*/, '')}>
        <i className="format undo" />
      </button>
      <button
        disabled={!toolbarState.canRedo || !isEditable}
        onClick={(e) =>
          dispatchToolbarCommand(REDO_COMMAND, undefined, isKeyboardInput(e))
        }
        title={IS_APPLE ? t('ed.redoMac') : t('ed.redoWin')}
        type="button"
        className="toolbar-item"
        aria-label={t('ed.redoWin').replace(/\s*\(.*/, '')}>
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
            title={`${t('ed.bold')} (${SHORTCUTS.BOLD})`}
            type="button"
            aria-label={`${t('ed.bold')}. ${SHORTCUTS.BOLD}`}>
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
            title={`${t('ed.italic')} (${SHORTCUTS.ITALIC})`}
            type="button"
            aria-label={`${t('ed.italic')}. ${SHORTCUTS.ITALIC}`}>
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
            title={`${t('ed.underline')} (${SHORTCUTS.UNDERLINE})`}
            type="button"
            aria-label={`${t('ed.underline')}. ${SHORTCUTS.UNDERLINE}`}>
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
              title={`${t('ed.codeBlock')} (${SHORTCUTS.INSERT_CODE_BLOCK})`}
              type="button"
              aria-label={t('ed.codeBlock')}>
              <i className="format code" />
            </button>
          )}
          <button
            disabled={!isEditable}
            onClick={insertLink}
            className={
              'toolbar-item spaced ' + (toolbarState.isLink ? 'active' : '')
            }
            aria-label={t('ed.link')}
            title={`${t('ed.link')} (${SHORTCUTS.INSERT_LINK})`}
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
            title={t('ed.textColor')}
          />
          <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel="Formatting background color"
            buttonIconClassName="icon bg-color"
            color={toolbarState.bgColor}
            onChange={onBgColorSelect}
            title={t('ed.bgColor')}
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
              title={t('ed.strikethrough')}
              aria-label={t('ed.strikethrough')}>
              <div className="icon-text-container">
                <i className="icon strikethrough" />
                <span className="text">{t('ed.strikethrough')}</span>
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
              title={t('ed.subscript')}
              aria-label={t('ed.subscript')}>
              <div className="icon-text-container">
                <i className="icon subscript" />
                <span className="text">{t('ed.subscript')}</span>
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
              title={t('ed.superscript')}
              aria-label={t('ed.superscript')}>
              <div className="icon-text-container">
                <i className="icon superscript" />
                <span className="text">{t('ed.superscript')}</span>
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
                <span className="text">{t('ed.highlight')}</span>
              </div>
            </DropDownItem>
            <DropDownItem
              onClick={(e) => clearFormatting(activeEditor, isKeyboardInput(e))}
              className="item wide"
              title="Clear text formatting"
              aria-label="Clear all text formatting">
              <div className="icon-text-container">
                <i className="icon clear" />
                <span className="text">{t('ed.clearFormat')}</span>
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
                buttonLabel={t('ed.insertLabel')}
                buttonAriaLabel={t('ed.insertAria')}
                buttonIconClassName="icon plus">
                <DropDownItem
                  onClick={() => {
                    showModal(t('ed.insertImage'), (onClose) => (
                      <InsertImageDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon image" />
                  <span className="text">{t('ed.image')}</span>
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
                    showModal(t('ed.insertAudio'), (onClose) => (
                      <TranscriptionDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon audio" />
                  <span className="text">{t('ed.audio')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('ed.insertTable'), (onClose) => (
                      <InsertTableDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon table" />
                  <span className="text">{t('ed.table')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('ed.insertColumns'), (onClose) => (
                      <InsertLayoutDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon columns" />
                  <span className="text">{t('ed.columnBlocks')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('ed.insertEquation'), (onClose) => (
                      <InsertEquationDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon equation" />
                  <span className="text">{t('ed.equation')}</span>
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
                  <span className="text">{t('ed.note')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() =>
                    dispatchToolbarCommand(INSERT_COLLAPSIBLE_COMMAND)
                  }
                  className="item">
                  <i className="icon caret-right" />
                  <span className="text">{t('ed.collapsible')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() =>
                    dispatchToolbarCommand(INSERT_HORIZONTAL_RULE_COMMAND)
                  }
                  className="item">
                  <i className="icon horizontal-rule" />
                  <span className="text">{t('ed.horizontalRule')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => dispatchToolbarCommand(INSERT_PAGE_BREAK)}
                  className="item">
                  <i className="icon page-break" />
                  <span className="text">{t('ed.pageBreak')}</span>
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

                <DropDownItem
                  onClick={() => {
                    activeEditor.dispatchCommand(INSERT_GAP_NODE_COMMAND, '');
                  }}
                  className="item">
                  <i className="icon fillgap" />
                  <span className="text">{t('ed.gap')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('ed.insertQuiz'), (onClose) => (
                      <InsertQuizDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon quiz" />
                  <span className="text">{t('ed.quiz')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('ed.insertOrdering'), (onClose) => (
                      <InsertOrderingDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon number" />
                  <span className="text">{t('ed.ordering')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('ed.insertTrueFalse'), (onClose) => (
                      <InsertTrueFalseDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon question" />
                  <span className="text">{t('ed.trueFalse')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    activeEditor.dispatchCommand(
                      INSERT_DEFINITION_NODE_COMMAND,
                      '',
                    );
                  }}
                  className="item">
                  <i className="icon plus" />
                  <span className="text">{t('ed.explanation')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('ed.insertSelectAnswer'), (onClose) => (
                      <InsertSelectAnswerDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon multi-select-checkbox" />
                  <span className="text">{t('ed.selectAnswer')}</span>
                </DropDownItem>
                <DropDownItem
                  onClick={() => {
                    showModal(t('ed.insertTodoList'), (onClose) => (
                      <InsertTodoDialog
                        activeEditor={activeEditor}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="item">
                  <i className="icon select-checkbox" />
                  <span className="text">{t('ed.taskList')}</span>
                </DropDownItem>

                <DropDownItem
                  onClick={() => {
                    activeEditor.dispatchCommand(GENERATE_DICTIONARY_COMMAND, '');
                  }}
                  className="item">
                  <i className="icon dictionary" />
                  <span className="text">{t('ed.dictionary')}</span>
                </DropDownItem>
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
        buttonLabel="AI"
        buttonAriaLabel={t('ed.aiOptions')}
        buttonIconClassName="icon ai">
        <DropDownItem
          onClick={() => {
            showModal(t('ed.lessonBuilderTitle'), (onClose) => (
              <LessonBuilderDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon generate-text" />
          <span className="text">{t('ed.lessonBuilderMenu')}</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal(t('ed.generateContent'), (onClose) => (
              <TextGeneratorDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon generate-text" />
          <span className="text">{t('ed.generateContent')}</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal(t('ed.translate'), (onClose) => (
              <LanguageSelectorDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon language" />
          <span className="text">{t('ed.translate')}</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal(t('ed.descriptiveTask'), (onClose) => (
              <DoTaskDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon task" />
          <span className="text">{t('ed.descriptiveTask')}</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal(t('ed.openQuestion'), (onClose) => (
              <QuestionAnswerDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon question" />
          <span className="text">{t('ed.openQuestion')}</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            showModal(t('ed.textToSpeech'), (onClose) => (
              <TextToVoiceDialog
                activeEditor={activeEditor}
                onClose={onClose}
              />
            ));
          }}
          className="item">
          <i className="icon audio" />
          <span className="text">{t('ed.textToSpeech')}</span>
        </DropDownItem>
      </DropDown>
      <Divider />
      <DropDown
        disabled={!isEditable}
        buttonClassName="toolbar-item spaced"
        buttonLabel={t('ed.tools')}
        buttonAriaLabel={t('ed.documentTools')}
        buttonIconClassName="icon dropdown-course">
        <DropDownItem
          onClick={exportHtml}
          className="item">
          <i className="icon html" />
          <span className="text">{t('ed.downloadHtml')}</span>
        </DropDownItem>
        <DropDownItem
          onClick={exportPdf}
          className="item">
          <i className="icon pdf" />
          <span className="text">{t('ed.downloadPdf')}</span>
        </DropDownItem>
        {!isEditorEmpty && (
          <DropDownItem
            onClick={() => {
              showModal(t('ed.clearEditor'), (onClose) => (
                <ShowClearDialog editor={editor} onClose={onClose} />
              ));
            }}
            className="item">
            <i className="icon clear" />
            <span className="text">{t('ed.clearEditor')}</span>
          </DropDownItem>
        )}
      </DropDown>
      <Divider />
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
  const { t } = useI18n();
  return (
    <>
      {t('ed.clearConfirm')}
      <div className="Modal__content">
        <Button
          onClick={() => {
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            editor.focus();
            onClose();
          }}>
          {t('ed.clear')}
        </Button>{' '}
        <Button
          variant="secondary"
          onClick={() => {
            onClose();
          }}>
          {t('ed.cancel')}
        </Button>
      </div>
    </>
  );
}
