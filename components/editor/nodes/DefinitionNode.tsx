import { 
    $applyNodeReplacement, 
    createCommand, 
    DecoratorNode, 
    DOMExportOutput, 
    EditorConfig, 
    LexicalNode, 
    NodeKey, 
    SerializedLexicalNode 
} from 'lexical';

export interface Definition {
    key: string;
    description: string;
}

export class DefinitionNode extends DecoratorNode<JSX.Element> {
    __key: string;
    __description: string;

    static getType(): string {
        return 'definition';
    }

    static clone(node: DefinitionNode): DefinitionNode {
        return new DefinitionNode(node.__key, node.__description, node.__key);
    }

    constructor(key: string, description: string, nodeKey?: NodeKey) {
        super(nodeKey);
        this.__key = key;
        this.__description = description;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = document.createElement('span');
        dom.style.backgroundColor = '#ffeb3b';
        dom.style.padding = '2px 4px';
        dom.style.borderRadius = '4px';
        dom.style.cursor = 'help';
        dom.setAttribute('title', this.__description);
        dom.setAttribute('data-definition', 'true');
        dom.contentEditable = 'false';
        dom.textContent = this.__key;

        // Create a tooltip element once and reuse it
        let tooltip: HTMLElement | null = null;

        const showTooltip = (e: MouseEvent) => {
            if (tooltip) return;
            
            tooltip = document.createElement('div');
            tooltip.className = 'definition-tooltip';
            tooltip.textContent = this.__description;
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = '#333';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '8px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '14px';
            tooltip.style.maxWidth = '200px';
            tooltip.style.zIndex = '1000';

            const rect = dom.getBoundingClientRect();
            tooltip.style.left = `${rect.left}px`;
            tooltip.style.top = `${rect.bottom + 8}px`;

            document.body.appendChild(tooltip);
        };

        const hideTooltip = () => {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
        };

        // Clean up event listeners when the node is removed
        const cleanup = () => {
            dom.removeEventListener('mouseenter', showTooltip);
            dom.removeEventListener('mouseleave', hideTooltip);
            hideTooltip();
        };

        dom.addEventListener('mouseenter', showTooltip);
        dom.addEventListener('mouseleave', hideTooltip);
        
        // Store cleanup function for later use
        (dom as any).__cleanup = cleanup;

        return dom;
    }

    updateDOM(prevNode: DefinitionNode, dom: HTMLElement): boolean {
        // Only update if the content has changed
        if (
            prevNode.__key !== this.__key ||
            prevNode.__description !== this.__description
        ) {
            dom.textContent = this.__key;
            dom.setAttribute('title', this.__description);
            return true;
        }
        return false;
    }

    destroyDOM(dom: HTMLElement): void {
        // Clean up event listeners
        if ((dom as any).__cleanup) {
            (dom as any).__cleanup();
        }
    }

    static importJSON(serializedNode: SerializedDefinitionNode): DefinitionNode {
        const { key, description } = serializedNode;
        return new DefinitionNode(key, description);
    }

    exportJSON(): SerializedDefinitionNode {
        return {
            type: 'definition',
            key: this.__key,
            description: this.__description,
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('span');
        element.setAttribute('data-definition', this.__key);
        element.setAttribute('title', this.__description);
        element.textContent = this.__key;
        return { element };
    }

    getTextContent(): string {
        return this.__key;
    }

    isIsolated(): boolean {
        return true;
    }
}

export interface SerializedDefinitionNode extends SerializedLexicalNode {
    key: string;
    description: string;
    type: 'definition';
    version: 1;
}

export function $createDefinitionNode(key: string, description: string): DefinitionNode {
    return new DefinitionNode(key, description);
}

export function $isDefinitionNode(node: LexicalNode | null | undefined): node is DefinitionNode {
    return node instanceof DefinitionNode;
}