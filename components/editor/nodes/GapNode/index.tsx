import { DecoratorNode } from "lexical";
import React from "react";
import { GapComponent } from "./GapComponent";


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
    return document.createElement("span");
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
