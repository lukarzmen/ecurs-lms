/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';

import {addClassNamesToElement} from '@lexical/utils';
import {ElementNode} from 'lexical';

export type SerializedLayoutContainerNode = Spread<
  {
    templateColumns: string;
  },
  SerializedElementNode
>;

function $convertLayoutContainerElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const styleAttributes = window.getComputedStyle(domNode);
  const templateColumns = styleAttributes.getPropertyValue(
    'grid-template-columns',
  );
  if (templateColumns) {
    const node = $createLayoutContainerNode(templateColumns);
    return {node};
  }
  return null;
}

export class LayoutContainerNode extends ElementNode {
  __templateColumns: string;

  constructor(templateColumns: string, key?: NodeKey) {
    super(key);
    this.__templateColumns = templateColumns;
  }

  static getType(): string {
    return 'layout-container';
  }

  static clone(node: LayoutContainerNode): LayoutContainerNode {
    return new LayoutContainerNode(node.__templateColumns, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.style.gridTemplateColumns = this.__templateColumns;
    if (typeof config.theme.layoutContainer === 'string') {
      addClassNamesToElement(dom, config.theme.layoutContainer);
    }
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-layout-container', 'true');

    // Export should be self-contained (PDF/print), so do not rely on editor theme CSS.
    element.style.display = 'grid';
    element.style.gridTemplateColumns = this.__templateColumns;
    element.style.gap = '12px';
    element.style.alignItems = 'start';

    element.style.border = '1px solid rgba(0,0,0,0.15)';
    element.style.borderRadius = '10px';
    element.style.padding = '12px 14px';
    element.style.margin = '12px 0';

    // Header spans the whole grid.
    const header = document.createElement('h3');
    header.textContent = 'Bloki w kolumnach';
    header.style.margin = '0 0 8px 0';
    header.style.gridColumn = '1 / -1';
    element.appendChild(header);
    return {element};
  }

  updateDOM(prevNode: LayoutContainerNode, dom: HTMLElement): boolean {
    if (prevNode.__templateColumns !== this.__templateColumns) {
      dom.style.gridTemplateColumns = this.__templateColumns;
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-layout-container')) {
          return null;
        }
        return {
          conversion: $convertLayoutContainerElement,
          priority: 2,
        };
      },
    };
  }

  static importJSON(json: SerializedLayoutContainerNode): LayoutContainerNode {
    return $createLayoutContainerNode(json.templateColumns);
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  exportJSON(): SerializedLayoutContainerNode {
    return {
      ...super.exportJSON(),
      templateColumns: this.__templateColumns,
      type: 'layout-container',
      version: 1,
    };
  }

  getTemplateColumns(): string {
    return this.getLatest().__templateColumns;
  }

  setTemplateColumns(templateColumns: string) {
    this.getWritable().__templateColumns = templateColumns;
  }
}

export function $createLayoutContainerNode(
  templateColumns: string,
): LayoutContainerNode {
  return new LayoutContainerNode(templateColumns);
}

export function $isLayoutContainerNode(
  node: LexicalNode | null | undefined,
): node is LayoutContainerNode {
  return node instanceof LayoutContainerNode;
}
