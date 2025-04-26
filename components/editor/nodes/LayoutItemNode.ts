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
        'url("data:image/svg+xml,%3Csvg fill=\'%23000000\' width=\'800px\' height=\'800px\' viewBox=\'0 0 16 16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M8 .5C3.58.5 0 3.86 0 8s3.58 7.5 8 7.5c4.69 0 1.04-2.83 2.79-4.55.76-.75 1.63-.87 2.44-.87.37 0 .73.03 1.06.03.99 0 1.72-.23 1.72-2.1C16 3.86 12.42.5 8 .5zm6.65 8.32c-.05.01-.16.02-.37.02-.14 0-.29 0-.45-.01-.19 0-.39-.01-.61-.01-.89 0-2.19.13-3.32 1.23-1.17 1.16-.9 2.6-.74 3.47.03.18.08.44.09.6-.16.05-.52.13-1.26.13-3.72 0-6.75-2.8-6.75-6.25S4.28 1.75 8 1.75s6.75 2.8 6.75 6.25c0 .5-.06.74-.1.82z\'/%3E%3Cpath d=\'M5.9 9.47c-1.03 0-1.86.8-1.86 1.79s.84 1.79 1.86 1.79 1.86-.8 1.86-1.79-.84-1.79-1.86-1.79zm0 2.35c-.35 0-.64-.25-.64-.56s.29-.56.64-.56.64.25.64.56-.29.56-.64.56zm-.2-4.59c0-.99-.84-1.79-1.86-1.79s-1.86.8-1.86 1.79.84 1.79 1.86 1.79 1.86-.8 1.86-1.79zm-1.86.56c-.35 0-.64-.25-.64-.56s.29-.56.64-.56.64.25.64.56-.29.56-.64.56zM7.37 2.5c-1.03 0-1.86.8-1.86 1.79s.84 1.79 1.86 1.79 1.86-.8 1.86-1.79S8.39 2.5 7.37 2.5zm0 2.35c-.35 0-.64-.25-.64-.56s.29-.56.64-.56.64.25.64.56-.29.56-.64.56zm2.47 1.31c0 .99.84 1.79 1.86 1.79s1.86-.8 1.86-1.79-.84-1.79-1.86-1.79-1.86.8-1.86 1.79zm2.5 0c0 .31-.29.56-.64.56s-.64-.25-.64-.56.29-.56.64-.56.64.25.64.56z\'/%3E%3C/svg%3E")';
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