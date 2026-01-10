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
import { DoTaskType } from "../../plugins/TaskPlugin";
import { ToCompleteNode } from "../ToCompleteNode";
import React from "react"; // Import React

// Serialized format *without* transient state
export type SerializedDoTaskNode = Spread<
  {
    task: string;
    hint: string | null;
    // No isCompleted here
  },
  SerializedLexicalNode
>;

export class DoTaskNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __task: string;
  __hint: string | null;
  // Transient state
  public __isCompleted: boolean = false; // Initialized to false

  constructor(task: string, hint: string | null, key?: NodeKey) { // Use NodeKey type
    super(key);
    this.__task = task;
    this.__hint = hint;
    // Transient state defaults are set by class property initializer
  }

  static getType(): string {
    return "do-task";
  }

  static clone(node: DoTaskNode): DoTaskNode {
    // Clone basic props
    const newNode = new DoTaskNode(node.__task, node.__hint, node.__key);
    // Manually copy transient state
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedDoTaskNode): DoTaskNode {
    // Import *without* transient state
    const { task, hint } = serializedNode;
    return new DoTaskNode(task, hint);
  }

  exportJSON(): SerializedDoTaskNode {
    // Export *without* transient state
    return {
      type: "do-task",
      version: 1,
      task: this.__task,
      hint: this.__hint,
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

    if (taskText) {
      const t = document.createElement('p');
      t.setAttribute('data-do-task', 'task');
      t.textContent = taskText;
      t.style.margin = '0 0 10px 0';
      t.style.whiteSpace = 'pre-wrap';
      container.appendChild(t);
    }

    if (hintText) {
      const hintLabel = document.createElement('div');
      hintLabel.textContent = 'Wskazówki';
      hintLabel.style.fontWeight = '700';
      hintLabel.style.margin = '0 0 6px 0';
      container.appendChild(hintLabel);

      const h = document.createElement('div');
      h.setAttribute('data-do-task', 'hint');
      h.textContent = hintText;
      h.style.whiteSpace = 'pre-wrap';
      container.appendChild(h);
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
            initialCompleted={this.__isCompleted} // Pass current transient state
            // Pass bound update method
            onComplete={(isCorrect) => this.setCompleted(isCorrect, editor)}
        />
    );
  }
}

// Update function signature to match constructor
export function $createDoTaskNode(qa: DoTaskType): DoTaskNode {
  return $applyNodeReplacement(new DoTaskNode(qa.task, qa.hint));
}

// Type guard
export function $isDoTaskNode(node: any): node is DoTaskNode {
    return node instanceof DoTaskNode;
}
