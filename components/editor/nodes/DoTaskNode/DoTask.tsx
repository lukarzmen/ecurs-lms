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
} from "lexical"; // Import necessary types
import DoTaskComponent from "./DoTaskComponent";
import { DoTaskItem, DoTaskType } from "../../plugins/TaskPlugin";
import { ToCompleteNode } from "../ToCompleteNode";
import React from "react"; // Import React

// Serialized format *without* transient state
export type SerializedDoTaskNode = Spread<
  {
    task: string;
    hint: string | null;
    items?: DoTaskItem[] | null;
    // No isCompleted here
  },
  SerializedLexicalNode
>;

export class DoTaskNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __task: string;
  __hint: string | null;
  __items: DoTaskItem[] | null;
  // Transient state
  public __isCompleted: boolean = false; // Initialized to false

  constructor(items: DoTaskItem[] | null, key?: NodeKey) { // Use NodeKey type
    super(key);
    this.__items = items;
    const firstItem = items?.[0];
    this.__task = firstItem?.task ?? "";
    this.__hint = firstItem?.hint ?? null;
    // Transient state defaults are set by class property initializer
  }

  static getType(): string {
    return "do-task";
  }

  static clone(node: DoTaskNode): DoTaskNode {
    // Clone basic props
    const newNode = new DoTaskNode(node.__items, node.__key);
    // Manually copy transient state
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedDoTaskNode): DoTaskNode {
    // Import *without* transient state
    const { task, hint, items } = serializedNode;
    const normalizedItems = Array.isArray(items) && items.length > 0
      ? items
      : (task ? [{ task, hint: hint ?? null }] : []);
    return new DoTaskNode(normalizedItems.length > 0 ? normalizedItems : null);
  }

  exportJSON(): SerializedDoTaskNode {
    // Export *without* transient state
    const normalizedItems = Array.isArray(this.__items) && this.__items.length > 0
      ? this.__items
      : (this.__task ? [{ task: this.__task, hint: this.__hint ?? null }] : []);
    const fallbackTask = normalizedItems[0]?.task ?? this.__task;
    const fallbackHint = normalizedItems[0]?.hint ?? this.__hint ?? null;
    return {
      type: "do-task",
      version: 1,
      task: fallbackTask,
      hint: fallbackHint,
      items: normalizedItems.length > 0 ? normalizedItems : null,
      // No isCompleted here
    };
  }

  createDOM(config: EditorConfig): HTMLElement { // Add config
    const element = document.createElement("div");
    // Optionally apply a theme class
    const className = config.theme.doTask || 'do-task-node';
    element.className = className;
    return element;
  }

  updateDOM(prevNode: DoTaskNode, dom: HTMLElement, config: EditorConfig): boolean { // Add config
    // Component handles updates
    return false;
  }

  exportDOM(): DOMExportOutput {
    const container = document.createElement('section');
    container.setAttribute('data-lexical-do-task', 'true');
    container.style.border = '1px solid rgba(0,0,0,0.15)';
    container.style.borderRadius = '10px';
    container.style.padding = '12px 14px';
    container.style.margin = '12px 0';

    const header = document.createElement('h3');
    header.textContent = 'Zadanie do rozwiązania';
    header.style.margin = '0 0 8px 0';
    container.appendChild(header);

    const taskText = this.__task ? String(this.__task).trim() : '';
    const hintText = this.__hint ? String(this.__hint).trim() : '';
    const items = Array.isArray(this.__items) && this.__items.length > 0
      ? this.__items
      : (taskText ? [{ task: taskText, hint: hintText || null }] : []);

    if (items.length > 0) {
      if (items.length === 1) {
        const t = document.createElement('p');
        t.setAttribute('data-do-task', 'task');
        t.textContent = String(items[0].task);
        t.style.margin = '0 0 10px 0';
        t.style.whiteSpace = 'pre-wrap';
        container.appendChild(t);
        if (items[0].hint) {
          const hintLabel = document.createElement('div');
          hintLabel.textContent = 'Wskazowki';
          hintLabel.style.fontWeight = '700';
          hintLabel.style.margin = '0 0 6px 0';
          container.appendChild(hintLabel);
          const h = document.createElement('div');
          h.setAttribute('data-do-task', 'hint');
          h.textContent = String(items[0].hint);
          h.style.whiteSpace = 'pre-wrap';
          container.appendChild(h);
        }
      } else {
        const list = document.createElement('ul');
        list.setAttribute('data-do-task', 'tasks');
        list.style.margin = '0 0 10px 18px';
        list.style.padding = '0';
        for (const item of items) {
          const li = document.createElement('li');
          li.textContent = String(item.task);
          li.style.margin = '0 0 6px 0';
          li.style.whiteSpace = 'pre-wrap';
          if (item.hint) {
            const hintNode = document.createElement('div');
            hintNode.textContent = String(item.hint);
            hintNode.style.margin = '4px 0 0 0';
            hintNode.style.whiteSpace = 'pre-wrap';
            li.appendChild(hintNode);
          }
          list.appendChild(li);
        }
        container.appendChild(list);
      }
    }

    return {element: container};
  }

  // Method to update the transient completion state
  setCompleted(completed: boolean, editor: LexicalEditor): void {
      editor.update(() => {
          const currentNode = $getNodeByKey(this.getKey());
          if ($isDoTaskNode(currentNode)) { // Use type guard
              const writable = currentNode.getWritable();
              writable.__isCompleted = completed;
          }
      });
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element { // Add editor, config
    return (
        <DoTaskComponent
            task={this.__task}
            hint={this.__hint}
          items={this.__items}
            initialCompleted={this.__isCompleted} // Pass current transient state
            // Pass bound update method
            onComplete={(isCorrect) => this.setCompleted(isCorrect, editor)}
        />
    );
  }
}

// Update function signature to match constructor
export function $createDoTaskNode(qa: DoTaskType): DoTaskNode {
  const normalizedItems = Array.isArray(qa.items)
    ? qa.items.filter((item) => item.task.trim() !== '')
    : [];
  return $applyNodeReplacement(
    new DoTaskNode(normalizedItems.length > 0 ? normalizedItems : null)
  );
}

// Type guard
export function $isDoTaskNode(node: any): node is DoTaskNode {
    return node instanceof DoTaskNode;
}
