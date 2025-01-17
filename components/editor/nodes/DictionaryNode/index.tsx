import { DecoratorNode, NodeKey } from "lexical";
import React from "react";
import { DictionaryComponent } from "./DictionaryComponent";

export interface Dictionary {
  [Key: string]: string;
}

export class DictionaryNode extends DecoratorNode<JSX.Element> {
  __dictionaryData: Dictionary;

  constructor(dictionaryData: Dictionary, key?: NodeKey) {
    super(key);
    this.__dictionaryData = dictionaryData;
  }

  static clone(node: DictionaryNode): DictionaryNode {
    return new DictionaryNode(node.__dictionaryData, node.__key);
  }

  static getType() {
    return "dictionary";
  }

  exportJSON() {
    return {
      type: "dictionary",
      version: 1,
      dictionaryData: this.__dictionaryData,
    };
  }
  static importJSON(serializedNode: any): DictionaryNode {
    const { dictionaryData } = serializedNode;
    return new DictionaryNode(dictionaryData);
  }
  updateDOM() {
    return false; // DOM does not need updates
  }

  createDOM() {
    const dom = document.createElement("div");
    dom.className = "dictionary-node";
    return dom;
  }

  decorate() {
    return <DictionaryComponent dictionary={this.__dictionaryData} />;
  }
}



