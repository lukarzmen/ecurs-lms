import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread, LexicalEditor, EditorConfig, $getNodeByKey, $applyNodeReplacement } from "lexical"; // Import necessary types
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
