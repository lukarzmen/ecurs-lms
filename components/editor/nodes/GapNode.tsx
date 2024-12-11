import { DecoratorNode, SerializedLexicalNode } from "lexical";

interface SerializedGapNode extends SerializedLexicalNode {
  hiddenText: string;
}

export class GapNode extends DecoratorNode<JSX.Element> {
    __hiddenText: string;
    static getType() {
      return 'gap';
    }
  
    static clone(node: { __hiddenText: any; }) {
      return new GapNode(node.__hiddenText);
    }
  
    constructor(hiddenText: string) {
      super();
      this.__hiddenText = hiddenText;
    }
    createDOM(_config: any, _editor: any): HTMLElement {
      const span = document.createElement('span');
      span.style.textDecoration = 'underline';
      span.dataset.hiddenText = this.__hiddenText;
      span.contentEditable = 'false';
      span.innerText = '_____';
        return span;
    }
  
  
    static importJSON(serializedNode: SerializedGapNode) {
      const { hiddenText } = serializedNode;
      return new GapNode(hiddenText);
    }
  
    exportJSON() {
      return {
        type: 'gap',
        version: 1,
        hiddenText: this.__hiddenText,
      };
    }
  }