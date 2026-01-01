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
import React from "react";
import { DictionaryComponent } from "./DictionaryComponent";
import { ToCompleteNode } from "../ToCompleteNode";

export interface Dictionary {
  [Key: string]: string;
}

// Serialized format *without* transient state
export type SerializedDictionaryNode = Spread<
  {
    dictionaryData: Dictionary;
    isEditable?: boolean;
    // No isCompleted here
  },
  SerializedLexicalNode
>;

export class DictionaryNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  private __dictionaryData: Dictionary;
  private __isEditable?: boolean;
  // Transient state
  public __isCompleted: boolean = false; // Initialized to false

  // Store editor instance locally, obtained during decoration
  protected __editor: LexicalEditor | null = null;

  public getDictionaryData(): Dictionary {
    const self = this.getLatest();
    return self.__dictionaryData;
  }

  public setDictionaryData(value: Dictionary) {
    // Use the stored editor instance
    if (this.__editor) {
        this.__editor.update(() => {
            const writableNode = this.getWritable();
            writableNode.__dictionaryData = value;
        });
    } else {
        console.warn("Editor instance not available in DictionaryNode for update.");
    }
  }

  constructor(initialDictionaryData: Dictionary, isEditable?: boolean, key?: NodeKey) {
    super(key);
    this.__dictionaryData = initialDictionaryData;
    this.__isEditable = isEditable;
    // Don't get editor here, as it might not be available yet. Get it in decorate.
  }

  // Getter/Setter for isEditable (if needed externally)
  public get isEditable(): boolean | undefined {
      return this.__isEditable;
  }
  public set isEditable(value: boolean | undefined) {
      // Update within an editor update cycle if necessary
      if (this.__editor) {
          this.__editor.update(() => {
              const writable = this.getWritable();
              writable.__isEditable = value;
          });
      } else {
          this.__isEditable = value; // Fallback if editor not set yet
      }
  }

  static clone(node: DictionaryNode): DictionaryNode {
    // Clone basic props
    const newNode = new DictionaryNode(node.__dictionaryData, node.__isEditable, node.__key);
    // Manually copy transient state
    newNode.__isCompleted = node.__isCompleted;
    // Don't copy editor instance, it will be set during decoration
    return newNode;
  }

  static getType() : string {
    return "dictionary";
  }

  exportJSON(): SerializedDictionaryNode {
    // Export *without* transient state
    const trimmedDictionaryData = Object.fromEntries(
      Object.entries(this.__dictionaryData).map(([key, value]) => [key.trim(), value.trim()])
    );
    return {
      type: "dictionary",
      version: 1,
      isEditable: this.__isEditable,
      dictionaryData: trimmedDictionaryData,
      // No isCompleted here
    };
  }

  static importJSON(serializedNode: SerializedDictionaryNode): DictionaryNode {
    // Import *without* transient state
    const { dictionaryData, isEditable } = serializedNode;
    return new DictionaryNode(dictionaryData, isEditable);
  }

  updateDOM(prevNode: DictionaryNode, dom: HTMLElement, config: EditorConfig): boolean { // Add config
    // Component handles updates
    return false;
  }

  createDOM(config: EditorConfig): HTMLElement { // Add config
    const dom = document.createElement("div");
    // Optionally apply theme class
    const className = config.theme.dictionary || 'dictionary-node';
    dom.className = className;
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const container = document.createElement('div');
    container.setAttribute('data-lexical-dictionary', 'true');

    const entries = Object.entries(this.__dictionaryData)
      .map(([key, value]) => [key.trim(), value.trim()] as const)
      .filter(([key, value]) => key.length > 0 || value.length > 0);

    for (const [key, value] of entries) {
      const row = document.createElement('div');
      row.textContent = `${key} - ${value}`;
      container.appendChild(row);
    }

    return {element: container};
  }

  getTextContent(): string {
    const entries = Object.entries(this.__dictionaryData)
      .map(([key, value]) => [key.trim(), value.trim()] as const)
      .filter(([key, value]) => key.length > 0 || value.length > 0);

    return entries.map(([key, value]) => `${key} - ${value}`).join('\n');
  }

  // Method to update the transient completion state
  setCompleted(completed: boolean, editor: LexicalEditor): void {
      editor.update(() => {
          const currentNode = $getNodeByKey(this.getKey());
          if ($isDictionaryNode(currentNode)) { // Use type guard
              const writable = currentNode.getWritable();
              writable.__isCompleted = completed;
          }
      });
  }

  handleDictionaryChanged = (dictionary: Dictionary, editor: LexicalEditor) => {
    editor.update(() => {
      const writableNode = this.getWritable();
      writableNode.__dictionaryData = dictionary;
    });
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element { // Add editor, config
    return (
        <DictionaryComponent
        isReadonly={!this.__isEditable}
        onDictionaryChanged={(dict) => this.handleDictionaryChanged(dict, editor)}
        dictionary={this.__dictionaryData}
        // Pass bound update method
        onComplete={(isCorrect) => this.setCompleted(isCorrect, editor)} initialCompleted={false}        />
    );
  }
}

// Helper function to create the node
export function $createDictionaryNode(initialDictionaryData: Dictionary, isEditable?: boolean): DictionaryNode {
    return $applyNodeReplacement(new DictionaryNode(initialDictionaryData, isEditable));
}

// Type guard
export function $isDictionaryNode(node: any): node is DictionaryNode {
    return node instanceof DictionaryNode;
}



