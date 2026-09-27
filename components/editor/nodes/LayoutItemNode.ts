import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  SerializedElementNode,
} from 'lexical';

import {addClassNamesToElement} from '@lexical/utils';
import {ElementNode, $getEditor} from 'lexical';

export type LayoutItemVariant = 'default' | 'info' | 'warning';

export type SerializedLayoutItemNode = SerializedElementNode & {
  backgroundColor: string;
  isEditable: boolean;
  variant?: LayoutItemVariant;
  showFrame?: boolean;
  extraLabel?: string;
  customBackgroundColor?: string;
  showLabel?: boolean;
};

function $convertLayoutItemElement(domNode: HTMLElement): DOMConversionOutput | null {
  if (!domNode.hasAttribute('data-lexical-layout-item')) {
    return null;
  }

  const variantAttr = domNode.getAttribute('data-lexical-layout-item-variant') as LayoutItemVariant | null;
  const variant: LayoutItemVariant =
    variantAttr === 'info' || variantAttr === 'warning' ? variantAttr : 'default';

  const bgAttr = domNode.getAttribute('data-lexical-layout-item-bg');
  const backgroundColor = variant === 'default' ? bgAttr || '#ffffff' : '#ffffff';
  const customBackgroundColor = variant === 'default' ? '' : bgAttr || '';
  const frameAttr = domNode.getAttribute('data-lexical-layout-item-frame');
  const showFrame = frameAttr === null ? true : frameAttr !== 'false';
  const extraLabel = domNode.getAttribute('data-lexical-layout-item-extra-label') || '';
  const showLabelAttr = domNode.getAttribute('data-lexical-layout-item-show-label');
  const showLabel = showLabelAttr === null ? true : showLabelAttr !== 'false';

  const node = $createLayoutItemNode(
    backgroundColor,
    false,
    variant,
    showFrame,
    extraLabel,
    customBackgroundColor,
    showLabel,
  );
  return {node};
}

export class LayoutItemNode extends ElementNode {
  __backgroundColor: string;
  __isEditable?: boolean;
  __variant: LayoutItemVariant;
  __showFrame: boolean;
  __extraLabel: string;
  __customBackgroundColor: string;
  __showLabel: boolean;
  __editor: any;

  constructor(
    key?: string,
    backgroundColor: string = '#ffffff',
    isEditable: boolean = true,
    variant: LayoutItemVariant = 'default',
    showFrame: boolean = true,
    extraLabel: string = '',
    customBackgroundColor: string = '',
    showLabel: boolean = true,
  ) {
    super(key);
    this.__backgroundColor = backgroundColor;
    this.__isEditable = isEditable;
    this.__variant = variant;
    this.__showFrame = showFrame;
    this.__extraLabel = extraLabel;
    this.__customBackgroundColor = customBackgroundColor;
    this.__showLabel = showLabel;
    this.__editor = $getEditor();
  }

  static getType(): string {
    return 'layout-item';
  }

  static clone(node: LayoutItemNode): LayoutItemNode {
    return new LayoutItemNode(
      node.__key,
      node.__backgroundColor,
      node.__isEditable ?? true,
      node.__variant,
      node.__showFrame,
      node.__extraLabel,
      node.__customBackgroundColor,
      node.__showLabel,
    );
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('layout-item');

    dom.setAttribute('data-lexical-layout-item', 'true');
    dom.setAttribute('data-lexical-layout-item-variant', this.__variant);
    dom.setAttribute(
      'data-lexical-layout-item-frame',
      this.__showFrame ? 'true' : 'false',
    );

    if (this.__showLabel) {
      const label = document.createElement('div');
      label.classList.add('layout-item-label');
      label.textContent = this.__variant === 'warning' ? 'Ważne' : 'Ciekawostka';
      label.contentEditable = 'false';
      dom.appendChild(label);
    }

    if (this.__extraLabel) {
      const extra = document.createElement('div');
      extra.classList.add('layout-item-extra-label');
      extra.textContent = this.__extraLabel;
      extra.contentEditable = 'false';
      dom.appendChild(extra);
    }

    if (this.__isEditable) {
      const motifButton = document.createElement('button');
      motifButton.type = 'button';
      motifButton.textContent = 'Motyw';
      motifButton.setAttribute('data-lexical-layout-item-control', 'true');
      motifButton.style.position = 'absolute';
      motifButton.style.top = '6px';
      motifButton.style.right = '6px';
      motifButton.style.padding = '2px 6px';
      motifButton.style.fontSize = '12px';
      motifButton.style.lineHeight = '16px';
      motifButton.style.borderRadius = '6px';
      motifButton.style.border = '1px solid #ddd';
      motifButton.style.background = '#fff';
      motifButton.style.cursor = 'pointer';
      motifButton.contentEditable = 'false';

      const popover = document.createElement('div');
      popover.classList.add('layout-item-popover');
      popover.contentEditable = 'false';
      popover.style.display = 'none';

      const labelToggleRow = document.createElement('div');
      labelToggleRow.classList.add('layout-item-popover-row');

      const labelToggleLabel = document.createElement('label');
      labelToggleLabel.classList.add('layout-item-popover-label');
      labelToggleLabel.textContent = 'Dodaj etykietę';

      const labelToggleInput = document.createElement('input');
      labelToggleInput.type = 'checkbox';
      labelToggleInput.checked = this.__showLabel;
      labelToggleInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      labelToggleInput.addEventListener('change', (e) => {
        e.stopPropagation();
        const checked = (e.target as HTMLInputElement).checked;
        const editor = this.__editor ?? $getEditor();
        if (!editor) return;
        editor.update(() => {
          const writableNode = this.getWritable();
          writableNode.__showLabel = checked;
        });
      });

      labelToggleRow.appendChild(labelToggleLabel);
      labelToggleRow.appendChild(labelToggleInput);
      popover.appendChild(labelToggleRow);

      const motifRow = document.createElement('div');
      motifRow.classList.add('layout-item-popover-row');
      if (!this.__showLabel) {
        motifRow.style.opacity = '0.5';
        motifRow.style.pointerEvents = 'none';
      }

      const makeMotifChoice = (label: string, value: LayoutItemVariant) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.classList.add('layout-item-popover-btn');
        btn.textContent = label;
        btn.disabled = !this.__showLabel;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const editor = this.__editor ?? $getEditor();
          if (!editor) return;
          editor.update(() => {
            const writableNode = this.getWritable();
            writableNode.__variant = value;
          });
        });
        return btn;
      };

      motifRow.appendChild(makeMotifChoice('Ciekawostka', 'default'));
      motifRow.appendChild(makeMotifChoice('Ważne', 'warning'));
      popover.appendChild(motifRow);

      const colorRow = document.createElement('div');
      colorRow.classList.add('layout-item-popover-row');

      const colorLabel = document.createElement('div');
      colorLabel.classList.add('layout-item-popover-label');
      colorLabel.textContent = 'Tło';
      colorRow.appendChild(colorLabel);

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.classList.add('layout-item-popover-color');
      // If "Ważne" uses default style and has no override, start from white.
      colorInput.value =
        this.__variant === 'default'
          ? this.__backgroundColor
          : this.__customBackgroundColor || '#ffffff';

      // Do NOT update the editor on every color move, otherwise Lexical will
      // re-create the node DOM and close the popover while the user is picking.
      let pendingColor = colorInput.value;
      let clearOverride = false;

      colorInput.addEventListener('input', (e) => {
        e.preventDefault();
        e.stopPropagation();
        pendingColor = (e.target as HTMLInputElement).value;
        clearOverride = false;
      });

      colorRow.appendChild(colorInput);

      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.classList.add('layout-item-popover-btn');
      applyBtn.textContent = 'Zastosuj';
      applyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const editor = this.__editor ?? $getEditor();
        if (!editor) return;
        editor.update(() => {
          const writableNode = this.getWritable();
          if (writableNode.__variant === 'default') {
            writableNode.__backgroundColor = pendingColor;
          } else {
            writableNode.__customBackgroundColor = clearOverride
              ? ''
              : pendingColor;
          }
        });
      });

      colorRow.appendChild(applyBtn);

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.classList.add('layout-item-popover-reset');
      resetBtn.textContent = 'Domyślne';
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Reset is staged; user confirms with "Zastosuj".
        if (this.__variant === 'default') {
          pendingColor = '#ffffff';
          clearOverride = false;
          colorInput.value = '#ffffff';
        } else {
          pendingColor = '#ffffff';
          clearOverride = true;
          colorInput.value = '#ffffff';
        }
      });

      colorRow.appendChild(resetBtn);
      popover.appendChild(colorRow);

      motifButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        popover.style.display = popover.style.display === 'none' ? 'block' : 'none';
      });

      dom.style.position = 'relative';
      dom.appendChild(motifButton);
      dom.appendChild(popover);
    }

    if (typeof config.theme.layoutItem === 'string') {
      addClassNamesToElement(dom, config.theme.layoutItem);
    }

    if (this.__variant === 'default') {
      dom.style.backgroundColor = this.__backgroundColor;
    } else if (this.__customBackgroundColor) {
      dom.style.backgroundColor = this.__customBackgroundColor;
    } else {
      dom.style.backgroundColor = '';
    }
    return dom;
  }

  updateDOM(prevNode: LayoutItemNode): boolean {
    if (
      this.__backgroundColor !== prevNode.__backgroundColor ||
      this.__isEditable !== prevNode.__isEditable ||
      this.__variant !== prevNode.__variant ||
      this.__showFrame !== prevNode.__showFrame ||
      this.__extraLabel !== prevNode.__extraLabel ||
      this.__customBackgroundColor !== prevNode.__customBackgroundColor ||
      this.__showLabel !== prevNode.__showLabel
    ) {
      return true;
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-layout-item')) {
          return null;
        }
        return {
          conversion: $convertLayoutItemElement,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-layout-item', 'true');
    element.setAttribute('data-lexical-layout-item-variant', this.__variant);
    element.setAttribute(
      'data-lexical-layout-item-frame',
      this.__showFrame ? 'true' : 'false',
    );
    if (this.__extraLabel) {
      element.setAttribute('data-lexical-layout-item-extra-label', this.__extraLabel);
    }
    element.setAttribute(
      'data-lexical-layout-item-show-label',
      this.__showLabel ? 'true' : 'false',
    );
    if (this.__variant === 'default' && this.__backgroundColor) {
      element.setAttribute('data-lexical-layout-item-bg', this.__backgroundColor);
    }
    if (this.__variant !== 'default' && this.__customBackgroundColor) {
      element.setAttribute('data-lexical-layout-item-bg', this.__customBackgroundColor);
    }

    // Export should be self-contained for PDF/print.
    element.style.position = 'relative';
    element.style.padding = '10px 12px';
    element.style.borderRadius = '10px';
    element.style.minWidth = '0';
    // Avoid breaking a column box in print when possible.
    (element.style as any).breakInside = 'avoid';
    (element.style as any).pageBreakInside = 'avoid';

    if (this.__showFrame) {
      element.style.border = '1px solid rgba(0,0,0,0.12)';
    }

    const background =
      this.__variant === 'default'
        ? this.__backgroundColor
        : this.__customBackgroundColor || '';
    if (background) {
      element.style.backgroundColor = background;
    }

    if (this.__showLabel) {
      const labelText =
        this.__variant === 'warning'
          ? 'Ważne'
          : this.__variant === 'info'
            ? 'Info'
            : 'Ciekawostka';

      const label = document.createElement('div');
      label.textContent = labelText;
      label.style.fontWeight = '700';
      label.style.margin = '0 0 6px 0';
      label.style.fontSize = '0.95em';
      element.appendChild(label);
    }

    if (this.__extraLabel) {
      const extra = document.createElement('div');
      extra.textContent = this.__extraLabel;
      extra.style.margin = '0 0 8px 0';
      extra.style.opacity = '0.85';
      extra.style.fontSize = '0.95em';
      element.appendChild(extra);
    }
    return {element};
  }
  isShadowRoot(): boolean {
    return true;
  }
  static importJSON(serializedNode: SerializedLayoutItemNode): LayoutItemNode {
    const {backgroundColor, variant, showFrame, extraLabel, customBackgroundColor, showLabel} = serializedNode;
    const node = $createLayoutItemNode(
      backgroundColor,
      false,
      variant ?? 'default',
      showFrame ?? true,
      extraLabel ?? '',
      customBackgroundColor ?? '',
      showLabel ?? true,
    );
    return node;
  }

  exportJSON(): SerializedLayoutItemNode {
    return {
      ...super.exportJSON(),
      type: 'layout-item',
      version: 1,
      backgroundColor: this.__backgroundColor,
      isEditable: this.__isEditable ?? true,
      variant: this.__variant,
      showFrame: this.__showFrame,
      extraLabel: this.__extraLabel,
      customBackgroundColor: this.__customBackgroundColor,
      showLabel: this.__showLabel,
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

  setVariant(variant: LayoutItemVariant): void {
    if (this.__editor) {
      this.__editor.update(() => {
        const writableNode = this.getWritable();
        writableNode.__variant = variant;
      });
    }
  }

  getVariant(): LayoutItemVariant {
    return this.__variant;
  }

  setShowFrame(showFrame: boolean): void {
    if (this.__editor) {
      this.__editor.update(() => {
        const writableNode = this.getWritable();
        writableNode.__showFrame = showFrame;
      });
    }
  }

  getShowFrame(): boolean {
    return this.__showFrame;
  }

  setExtraLabel(extraLabel: string): void {
    if (this.__editor) {
      this.__editor.update(() => {
        const writableNode = this.getWritable();
        writableNode.__extraLabel = extraLabel;
      });
    }
  }

  getExtraLabel(): string {
    return this.__extraLabel;
  }

  setCustomBackgroundColor(customBackgroundColor: string): void {
    if (this.__editor) {
      this.__editor.update(() => {
        const writableNode = this.getWritable();
        writableNode.__customBackgroundColor = customBackgroundColor;
      });
    }
  }

  getCustomBackgroundColor(): string {
    return this.__customBackgroundColor;
  }

  setShowLabel(showLabel: boolean): void {
    if (this.__editor) {
      this.__editor.update(() => {
        const writableNode = this.getWritable();
        writableNode.__showLabel = showLabel;
      });
    }
  }

  getShowLabel(): boolean {
    return this.__showLabel;
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

export function $createLayoutItemNode(
  backgroundColor: string = '#ffffff',
  isEditable: boolean = true,
  variant: LayoutItemVariant = 'default',
  showFrame: boolean = true,
  extraLabel: string = '',
  customBackgroundColor: string = '',
  showLabel: boolean = true,
): LayoutItemNode {
  return new LayoutItemNode(
    undefined,
    backgroundColor,
    isEditable,
    variant,
    showFrame,
    extraLabel,
    customBackgroundColor,
    showLabel,
  );
}

export function $isLayoutItemNode(
  node: LexicalNode | null | undefined,
): node is LayoutItemNode {
  return node instanceof LayoutItemNode;
}