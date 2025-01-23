import { DecoratorNode, NodeKey } from "lexical";
import React from "react";
import { DictionaryComponent } from "./DictionaryComponent";

export interface Dictionary {
  [Key: string]: string;
}

export class DictionaryNode extends DecoratorNode<JSX.Element> {
  __dictionaryData: Dictionary;
  private __isEditable?: boolean;

  constructor(dictionaryData: Dictionary, isEditable?: boolean, key?: NodeKey) {
    super(key);
    this.__dictionaryData = dictionaryData;
    this.__isEditable = isEditable;
  }
  public set isEditable(value: boolean) {
    this.__isEditable = value;
  }
  static clone(node: DictionaryNode): DictionaryNode {
    return new DictionaryNode(node.__dictionaryData, node.__isEditable, node.__key);
  }

  static getType() {
    return "dictionary";
  }

  exportJSON() {
    return {
      type: "dictionary",
      version: 1,
      isEditable: this.__isEditable,
      dictionaryData: this.__dictionaryData,
    };
  }
  static importJSON(serializedNode: any): DictionaryNode {
    const { dictionaryData, isEditable } = serializedNode;
    return new DictionaryNode(dictionaryData, isEditable);
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
    return <DictionaryComponent isReadonly={!this.__isEditable} dictionary={this.__dictionaryData} />;
  }
}



