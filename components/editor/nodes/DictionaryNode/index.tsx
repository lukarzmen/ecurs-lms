import { $getEditor, DecoratorNode, NodeKey } from "lexical";
import React from "react";
import { DictionaryComponent } from "./DictionaryComponent";

export interface Dictionary {
  [Key: string]: string;
}

export class DictionaryNode extends DecoratorNode<JSX.Element> {
  private __dictionaryData: Dictionary;
  __editor: any;
  
  public getDictionaryData(): Dictionary {
    const self = this.getLatest();
    return self.__dictionaryData;
  }
  public setDictionaryData(value: Dictionary) {
    this.__editor.update(() => {
      const writableNode = this.getWritable();
      writableNode.__dictionaryData = value;
    });
  }

  private __isEditable?: boolean;

  constructor(initialDictionaryData: Dictionary, isEditable?: boolean, key?: NodeKey) {
    super(key);
    this.__dictionaryData = initialDictionaryData;
    this.__isEditable = isEditable;
    this.__editor = $getEditor();
  }
  
  public set isEditable(value: boolean) {
    this.__isEditable = value;
  }
  static clone(node: DictionaryNode): DictionaryNode {
    return new DictionaryNode(node.__dictionaryData, node.__isEditable, node.__key);
  }

  static getType() : string {
    return "dictionary";
  }

  exportJSON() {
    const trimmedDictionaryData = Object.fromEntries(
      Object.entries(this.__dictionaryData).map(([key, value]) => [key.trim(), value.trim()])
    );
    return {
      type: "dictionary",
      version: 1,
      isEditable: this.__isEditable,
      dictionaryData: trimmedDictionaryData,
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
  handleDictionaryChanged = (dictionary: Dictionary) => {
    this.setDictionaryData(dictionary);
  }
  decorate() {
    return <DictionaryComponent isReadonly={!this.__isEditable} onDictionaryChanged={this.handleDictionaryChanged} dictionary={this.__dictionaryData} />;
  }
}



