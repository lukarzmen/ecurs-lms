import { DecoratorNode, SerializedLexicalNode, SerializedTextNode, Spread } from "lexical";
import React, { useState } from "react";
export type SerializedDescriptionNode = Spread<
  {
    text: string;
    definition: string;
  },
  SerializedLexicalNode
>;

export class DescriptionNode extends DecoratorNode<JSX.Element> {
  __text: string;
  __definition: string;

  constructor(text: string, definition: string, key?: string) {
    super(key);
    this.__text = text;
    this.__definition = definition;
  }

  static getType(): string {
    return "description";
  }

  static clone(node: DescriptionNode): DescriptionNode {
    return new DescriptionNode(node.__text, node.__definition, node.__key);
  }

  static importJSON(serializedNode: SerializedDescriptionNode): DescriptionNode {
    const { text, definition } = serializedNode;
    return new DescriptionNode(text, definition);
  }

  exportJSON(): SerializedDescriptionNode {
    return {
      text: this.__text,
      definition: this.__definition,
      type: "description",
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <DescriptionComponent text={this.__text} definition={this.__definition} />;
  }
}

export function $createDefinitionNode(text: string, definition: string): DescriptionNode {
  return new DescriptionNode(text, definition);
}

export type DescriptionComponentProps = {
  text: string;
  definition: string;
};

export function DescriptionComponent({ text, definition }: DescriptionComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shortDefinition = definition.split(" ").slice(0, 100).join(" ");

  return (
    <span className="relative group">
      <span
        className="bg-yellow-200 border border-yellow-400 cursor-pointer text-blue-500 p-1 rounded"
        onClick={() => setIsModalOpen(true)}
      >
        {text}
      </span>
      <span className="absolute top-full mt-2 w-32 p-2 bg-gray-700 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
        {shortDefinition}
      </span>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">{text}</h2>
            <p className="text-gray-700 mb-6">{definition}</p>
          </div>
        </div>
      )}
    </span>
  );
}
