import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread, LexicalEditor, EditorConfig, $getNodeByKey, $applyNodeReplacement } from "lexical";
import React from "react"; // Import React
import { GapComponent } from "./GapComponent"; // Import the component
import { ToCompleteNode } from "../ToCompleteNode"; // Import the interface

// Serialized format *without* transient state
export type SerializedGapNode = Spread<
  {
    hiddenText: string;
    // No isCompleted here
  },
  SerializedLexicalNode
>;

export class GapNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __hiddenText: string;
  // Transient state
  public __isCompleted: boolean = false; // Initialized to false

  constructor(hiddenText: string, key?: NodeKey) { // Use NodeKey type
    super(key);
    this.__hiddenText = hiddenText;
    // Transient state defaults are set by class property initializer
  }

  static getType(): string {
    return "gap";
  }

  static clone(node: GapNode): GapNode {
    // Clone basic props
    const newNode = new GapNode(node.__hiddenText, node.__key);
    // Manually copy transient state
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedGapNode): GapNode {
    // Import *without* transient state
    const { hiddenText } = serializedNode;
    return new GapNode(hiddenText);
  }

  exportJSON(): SerializedGapNode {
    // Export *without* transient state
    return {
      type: "gap",
      version: 1,
      hiddenText: this.__hiddenText,
      // No isCompleted here
    };
  }

  createDOM(config: EditorConfig): HTMLElement { // Add config
    const element = document.createElement("span");
    // Optionally apply a theme class
    const className = config.theme.gap || 'gap-node';
    element.className = className;
    return element;
  }

  updateDOM(prevNode: GapNode, dom: HTMLElement, config: EditorConfig): boolean { // Add config
    // Component handles updates
    return false;
  }

  // Method to update the transient completion state
  setCompleted(completed: boolean, editor: LexicalEditor): void {
      editor.update(() => {
          const currentNode = $getNodeByKey(this.getKey());
          if ($isGapNode(currentNode)) { // Use type guard
              const writable = currentNode.getWritable();
              writable.__isCompleted = completed;
          }
      });
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element { // Add editor, config
    return (
        <GapComponent
            hiddenText={this.__hiddenText}
            initialCompleted={this.__isCompleted} // Pass current transient state
            // Pass bound update method
            onComplete={(isCorrect) => this.setCompleted(isCorrect, editor)}
        />
    );
  }
}

export function $createGapNode(hiddenText: string): GapNode {
  return $applyNodeReplacement(new GapNode(hiddenText));
}

// Type guard
export function $isGapNode(node: any): node is GapNode {
    return node instanceof GapNode;
}
