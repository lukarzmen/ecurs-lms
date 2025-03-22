import type {
  DOMConversionMap,
  EditorConfig,
  LexicalNode,
  SerializedElementNode,
} from 'lexical';

import {addClassNamesToElement} from '@lexical/utils';
import {ElementNode, $getEditor} from 'lexical';

export type SerializedLayoutItemNode = SerializedElementNode & {
  backgroundColor: string;
  isEditable: boolean;
};

export class LayoutItemNode extends ElementNode {
  __backgroundColor: string;
  __isEditable?: boolean;
  __editor: any;

  constructor(key?: string, backgroundColor: string = '#ffffff', isEditable: boolean = true) {
    super(key);
    this.__backgroundColor = backgroundColor;
    this.__isEditable = isEditable;
    this.__editor = $getEditor();
  }

  static getType(): string {
    return 'layout-item';
  }

  static clone(node: LayoutItemNode): LayoutItemNode {
    return new LayoutItemNode(node.__key, node.__backgroundColor, node.__isEditable ?? true);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('layout-item');

    if (this.__isEditable) {
      // Create a button for the color palette
      const colorButton = document.createElement('button');
      colorButton.classList.add('color-button');
      colorButton.style.position = 'absolute';
      colorButton.style.top = '5px';
      colorButton.style.right = '5px';
      colorButton.style.width = '20px';
      colorButton.style.height = '20px';
      colorButton.style.borderRadius = '50%';
      colorButton.style.border = 'none';
      colorButton.style.cursor = 'pointer';
      colorButton.style.backgroundImage =
        'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'currentColor\'%3E%3Cpath d=\'M0 0h24v24H0z\' fill=\'none\'/%3E%3Cpath d=\'M19.77 5.23c.39-.39.39-1.02 0-1.41l-3.59-3.59a.9959.9959 0 0 0-1.41 0L2.5 12.5V19h6.5l11.27-11.27zM7 17H5v-2l9.06-9.06 2 2L7 17zm12.37-9.37l-1.41 1.41-2-2 1.41-1.41c.39-.39 1.02-.39 1.41 0l.59.59c.39.39.39 1.02 0 1.41z\'/%3E%3C/svg%3E")'; // Fill tool icon
      colorButton.style.backgroundSize = 'cover';

      // Handle background color change
      colorButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

        this.__editor.update(() => {
          const writableNode = this.getWritable();
          writableNode.__backgroundColor = randomColor;
          dom.style.backgroundColor = randomColor;
        });

        const colorEvent = new CustomEvent('colorChange', {
          detail: { color: randomColor },
        });
        dom.dispatchEvent(colorEvent);
      });

      dom.style.position = 'relative'; // Needed for absolute positioning of the button
      dom.appendChild(colorButton);
    }

    if (typeof config.theme.layoutItem === 'string') {
      addClassNamesToElement(dom, config.theme.layoutItem);
    }

    dom.style.backgroundColor = this.__backgroundColor; // Apply the background color
    return dom;
  }

  updateDOM(prevNode: LayoutItemNode): boolean {
    if (this.__backgroundColor !== prevNode.__backgroundColor || this.__isEditable !== prevNode.__isEditable) {
      return true;
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {};
  }
  isShadowRoot(): boolean {
    return true;
  }
  static importJSON(serializedNode: SerializedLayoutItemNode): LayoutItemNode {
    const { backgroundColor } = serializedNode;
    const node = $createLayoutItemNode(backgroundColor, false);
    return node;
  }

  exportJSON(): SerializedLayoutItemNode {
    return {
      ...super.exportJSON(),
      type: 'layout-item',
      version: 1,
      backgroundColor: this.__backgroundColor,
      isEditable: this.__isEditable ?? true,
    };
  }

  setBackgroundColor(backgroundColor: string): void {
    if (this.__editor) {
      this.__editor.update(() => {
        const writableNode = this.getWritable();
        writableNode.__backgroundColor = backgroundColor;
      });
    }
  }

  getBackgroundColor(): string {
    return this.__backgroundColor;
  }

  set isEditable(value: boolean) {
    this.__isEditable = value;
  }

  get isEditable(): boolean {
    return this.__isEditable ?? true;
  }

  // Initialize the editor reference
  initializeEditor(editor: any) {
    this.__editor = editor;
  }
}

export function $createLayoutItemNode(backgroundColor: string = '#ffffff', isEditable: boolean = true): LayoutItemNode {
  return new LayoutItemNode(undefined, backgroundColor, isEditable);
}

export function $isLayoutItemNode(
  node: LexicalNode | null | undefined,
): node is LayoutItemNode {
  return node instanceof LayoutItemNode;
}