import { DecoratorNode } from "lexical";
import React from "react";
import { SelectAnswerComponent } from "./SelectAnswerComponent";

export interface SelectableAnswerNodeProps {
    options: string[];
    selectedIndex: number;
    }

export class SelectAnswerNode extends DecoratorNode<JSX.Element> {
    private __answers: string[];
    private __correctAnswerIndex: number;

  constructor(selectAnswerNodeProps: SelectableAnswerNodeProps, key?: string) {
    super(key);
    this.__answers = selectAnswerNodeProps.options;
    this.__correctAnswerIndex = selectAnswerNodeProps.selectedIndex;
  }

  static getType(): string {
    return "select-answer-quiz";
  }

  static clone(node: SelectAnswerNode): SelectAnswerNode {
    return new SelectAnswerNode({ options: node.__answers, selectedIndex: node.__correctAnswerIndex }, node.__key);
  }

  static importJSON(serializedNode: any): SelectAnswerNode {
    const { answers, correctAnswerIndex } = serializedNode;
    return new SelectAnswerNode({ options: answers, selectedIndex: correctAnswerIndex });
  }

  exportJSON(): any {
    return {
      type: "select-answer-quiz",
      version: 1,
      answers: this.__answers,
      correctAnswerIndex: this.__correctAnswerIndex,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <SelectAnswerComponent answers={this.__answers} correctAnswerIndex={this.__correctAnswerIndex} />;
  }
}
