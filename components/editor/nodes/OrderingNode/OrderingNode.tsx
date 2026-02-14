import { Suspense } from "react";
import OrderingComponent, { OrderingItem } from "./OrderingComponent";
import {
  $applyNodeReplacement,
  $getNodeByKey,
  DecoratorNode,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { ToCompleteNode } from "../ToCompleteNode";
import { withNodeErrorBoundary } from "../Error/BrokenNode";

export type SerializedOrderingNode = Spread<
  {
    items: OrderingItem[];
  },
  SerializedLexicalNode
>;

function normalizeItems(items: OrderingItem[]): OrderingItem[] {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const text = typeof item?.text === "string" ? item.text.trim() : "";
      if (!text) return null;
      const id = typeof item?.id === "string" && item.id.trim()
        ? item.id.trim()
        : `ordering-${index}-${text.slice(0, 12)}`;
      return { id, text } satisfies OrderingItem;
    })
    .filter(Boolean) as OrderingItem[];
}

function shuffleItems(items: OrderingItem[]): OrderingItem[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class OrderingNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __items: OrderingItem[];
  public __isCompleted: boolean = false;

  static getType(): string {
    return "ordering";
  }

  static clone(node: OrderingNode): OrderingNode {
    const newNode = new OrderingNode(node.__items, node.__key);
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedOrderingNode): OrderingNode {
    return new OrderingNode(normalizeItems(serializedNode.items));
  }

  exportJSON(): SerializedOrderingNode {
    return {
      items: this.__items,
      type: "ordering",
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    const className = config.theme.ordering || "ordering-node";
    element.className = className;
    return element;
  }

  updateDOM(prevNode: OrderingNode, dom: HTMLElement, config: EditorConfig): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const container = document.createElement("section");
    container.setAttribute("data-lexical-ordering", "true");

    const header = document.createElement("h2");
    header.textContent = "Ułóż kolejność";
    container.appendChild(header);

    const items = Array.isArray(this.__items) ? this.__items : [];
    if (items.length > 0) {
      const shuffledItems = shuffleItems(items);
      const ol = document.createElement("ol");
      for (const item of shuffledItems) {
        const li = document.createElement("li");
        if (item?.id) {
          li.setAttribute("data-ordering-id", String(item.id));
        }
        li.textContent = item?.text ? String(item.text) : "";
        ol.appendChild(li);
      }
      container.appendChild(ol);
      
      // Add answer key section
      const answerSection = document.createElement("div");
      answerSection.style.marginTop = "1.5rem";
      answerSection.style.padding = "1rem";
      answerSection.style.border = "1px solid #e5e7eb";
      
      const answerHeader = document.createElement("strong");
      answerHeader.textContent = "Klucz odpowiedzi:";
      answerSection.appendChild(answerHeader);
      
      const answerList = document.createElement("ol");
      answerList.style.marginTop = "0.5rem";
      for (const item of items) {
        const li = document.createElement("li");
        li.textContent = item?.text ? String(item.text) : "";
        answerList.appendChild(li);
      }
      answerSection.appendChild(answerList);
      container.appendChild(answerSection);
    }

    return { element: container };
  }

  getTextContent(): string {
    const items = Array.isArray(this.__items) ? this.__items : [];
    return items
      .map((item) => (item?.text ? String(item.text).trim() : ""))
      .filter(Boolean)
      .join("\n");
  }

  constructor(items: OrderingItem[], key?: NodeKey) {
    super(key);
    this.__items = normalizeItems(items);
  }

  setCompleted(completed: boolean, editor: LexicalEditor): void {
    editor.update(() => {
      const currentNode = $getNodeByKey(this.getKey());
      if ($isOrderingNode(currentNode)) {
        const writable = currentNode.getWritable();
        writable.__isCompleted = completed;
      }
    });
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return withNodeErrorBoundary(
      <Suspense fallback={null}>
        <OrderingComponent
          items={this.__items}
          initialCompleted={this.__isCompleted}
          onComplete={(isCorrect) => this.setCompleted(isCorrect, editor)}
        />
      </Suspense>
    );
  }
}

export function $createOrderingNode(items: OrderingItem[]): OrderingNode {
  return $applyNodeReplacement(new OrderingNode(items));
}

export function $isOrderingNode(node: any): node is OrderingNode {
  return node instanceof OrderingNode;
}
