import { Suspense } from "react";
import TodoComponent, { TodoItem } from "./TodoComponent";
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

export type SerializedTodoNode = Spread<
  {
    title: string;
    items: TodoItem[];
  },
  SerializedLexicalNode
>;

export class TodoNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __title: string;
  __items: TodoItem[];
  public __isCompleted: boolean = false;

  static getType(): string {
    return "todo";
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    const className = config.theme.todo || "todo-node";
    element.className = className;
    return element;
  }

  static clone(node: TodoNode): TodoNode {
    const newNode = new TodoNode(node.__title, node.__items, node.__key);
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedTodoNode): TodoNode {
    return new TodoNode(serializedNode.title, serializedNode.items);
  }

  updateDOM(prevNode: TodoNode, dom: HTMLElement, config: EditorConfig): boolean {
    return false;
  }

  constructor(title: string, items: TodoItem[], key?: NodeKey) {
    super(key);
    this.__title = title;
    this.__items = items;
  }

  setCompleted(completed: boolean, editor: LexicalEditor): void {
    editor.update(() => {
      const currentNode = $getNodeByKey(this.getKey());
      if ($isTodoNode(currentNode)) {
        const writable = currentNode.getWritable();
        writable.__isCompleted = completed;
      }
    });
  }

  exportJSON(): SerializedTodoNode {
    return {
      title: this.__title,
      items: this.__items,
      type: "todo",
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const container = document.createElement('div');
    container.setAttribute('data-lexical-todo', 'true');

    const titleText = this.__title ? String(this.__title) : '';
    if (titleText) {
      const title = document.createElement('h3');
      title.textContent = titleText;
      container.appendChild(title);
    }

    const items = Array.isArray(this.__items) ? this.__items : [];
    if (items.length > 0) {
      const ul = document.createElement('ul');

      for (const item of items) {
        const li = document.createElement('li');
        if (item?.id) {
          li.setAttribute('data-todo-id', String(item.id));
        }

        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.disabled = true;
        checkbox.checked = !!item?.checked;

        const text = document.createTextNode(` ${item?.text ? String(item.text) : ''}`);
        label.appendChild(checkbox);
        label.appendChild(text);
        li.appendChild(label);
        ul.appendChild(li);
      }

      container.appendChild(ul);
    }

    return {element: container};
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return withNodeErrorBoundary(
      <Suspense fallback={null}>
        <TodoComponent
          title={this.__title}
          initialItems={this.__items}
          onComplete={(completed) => this.setCompleted(completed, editor)}
        />
      </Suspense>
    );
  }
}

export function $createTodoNode(title: string, items: TodoItem[]): TodoNode {
  return $applyNodeReplacement(new TodoNode(title, items));
}

export function $isTodoNode(node: any): node is TodoNode {
  return node instanceof TodoNode;
}
