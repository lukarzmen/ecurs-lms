import { DecoratorNode } from "lexical";
import React, { useState } from "react";

type GapComponentProps = {
  hiddenText: string;
};

function GapComponent({ hiddenText }: GapComponentProps) {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const checkAnswer = () => {
    setIsCorrect(userInput.trim() === hiddenText);
  };

  return (
    <div className="flex items-center space-x-4">
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        placeholder="Type your answer"
      />
      <button
        onClick={checkAnswer}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Check
      </button>
      {isCorrect !== null && (
        <span
          className={`ml-2 font-semibold ${
            isCorrect ? "text-green-600" : "text-red-600"
          }`}
        >
          {isCorrect ? "Correct!" : "Try Again!"}
        </span>
      )}
    </div>
  );
}

export class GapNode extends DecoratorNode<JSX.Element> {
  __hiddenText: string;

  constructor(hiddenText: string, key?: string) {
    super(key);
    this.__hiddenText = hiddenText;
  }

  static getType(): string {
    return "gap";
  }

  static clone(node: GapNode): GapNode {
    return new GapNode(node.__hiddenText, node.__key);
  }

  static importJSON(serializedNode: any): GapNode {
    const { hiddenText } = serializedNode;
    return new GapNode(hiddenText);
  }

  exportJSON(): any {
    return {
      type: "gap",
      version: 1,
      hiddenText: this.__hiddenText,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <GapComponent hiddenText={this.__hiddenText} />;
  }
}

export function $createGapNode(hiddenText: string): GapNode {
  return new GapNode(hiddenText);
}
