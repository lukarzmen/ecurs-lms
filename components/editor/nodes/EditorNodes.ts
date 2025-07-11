/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Klass, LexicalNode} from 'lexical';

import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {HashtagNode} from '@lexical/hashtag';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {ListItemNode, ListNode} from '@lexical/list';
import {MarkNode} from '@lexical/mark';
import {OverflowNode} from '@lexical/overflow';
import {HorizontalRuleNode} from '@lexical/react/LexicalHorizontalRuleNode';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {TableCellNode, TableNode, TableRowNode} from '@lexical/table';

import {CollapsibleContainerNode} from '../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import {CollapsibleContentNode} from '../plugins/CollapsiblePlugin/CollapsibleContentNode';
import {CollapsibleTitleNode} from '../plugins/CollapsiblePlugin/CollapsibleTitleNode';
import {AutocompleteNode} from './AutocompleteNode';
import {EmojiNode} from './EmojiNode';
import {EquationNode} from './EquationNode';
import {ExcalidrawNode} from './ExcalidrawNode';
import {ImageNode} from './ImageNode';
import {InlineImageNode} from './InlineImageNode/InlineImageNode';
import {KeywordNode} from './KeywordNode';
import {LayoutContainerNode} from './LayoutContainerNode';
import {LayoutItemNode} from './LayoutItemNode';
import {MentionNode} from './MentionNode';
import {PageBreakNode} from './PageBreakNode';
import {PollNode} from './PollNode';
import {StickyNode} from './StickyNode';
import {YouTubeNode} from './YouTubeNode';
import { GapNode } from './GapNode';
import {AudioNode} from './AudioNode';
import { QuizNode } from './QuizNode/QuizNode';
import { DictionaryKeywordNode } from './DictionaryNode/DictionaryKeywordNode';
import { DictionaryNode } from './DictionaryNode';
import { QuestionAnswerNode } from './QuestionAnswerNode/QuestionAnswer';
import { Description } from '@radix-ui/react-dialog';
import { DefinitionNode } from './DefinitionNode';
import { DescriptionNode } from './DictionaryNode/DescriptionNode';
import { SelectAnswerNode } from './SelectAnserNode';
import { DoTaskNode } from './DoTaskNode/DoTask';
import { TodoNode } from './TodoNode/TodoNode';

const EditorNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  PollNode,
  StickyNode,
  ImageNode,
  InlineImageNode,
  MentionNode,
  EmojiNode,
  ExcalidrawNode,
  EquationNode,
  AutocompleteNode,
  KeywordNode,
  HorizontalRuleNode,
  YouTubeNode,
  MarkNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  PageBreakNode,
  LayoutContainerNode,
  LayoutItemNode,
  GapNode,
  SelectAnswerNode,
  AudioNode,
  QuizNode,
  TodoNode,
  DictionaryNode,
  DefinitionNode,
  DescriptionNode,
  DictionaryKeywordNode,
  QuestionAnswerNode,
  DoTaskNode,
];

export default EditorNodes;
