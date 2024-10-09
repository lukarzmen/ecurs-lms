import { DecoratorNode } from 'lexical';
import React from 'react';

// Define a React component that will represent the textarea in the editor
function TextAreaComponent() {
  return <textarea className="textarea-node" placeholder="Enter text here" />;
}

export class TextAreaNode extends DecoratorNode<{}> {
  static getType() {
    return 'textarea';
  }

  constructor(key?: string) {
    super(key);
  }

  static clone(node: { __key: any; }) {
    return new TextAreaNode(node.__key);
  }

  // Implementing the importJSON method for deserialization
  static importJSON(serializedNode: any) {
    return new TextAreaNode();
  }

  // Exporting the node to JSON
  exportJSON() {
    return {
      type: 'textarea',
      version: 1,
    };
  }

  // The decorate method is responsible for rendering the React component
  decorate() {
    return <TextAreaComponent />;
  }

  // Create the DOM element for non-react environments (e.g., SSR)
  createDOM() {
    const container = document.createElement('div');
    return container;
  }

  updateDOM(prevNode: any, dom: any) {
    return false; // No DOM updates needed
  }

  // Optional: If you want to export the text content inside the textarea
  exportText() {
    return ''; // You can customize this if your textarea holds specific text
  }
}

export function $createTextAreaNode() {
  return new TextAreaNode();
}
