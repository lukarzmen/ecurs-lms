import { TextNode, SerializedTextNode, NodeKey } from "lexical";

export type SerializedGapNode = SerializedTextNode & {
  hiddenText: string;
};

export class GapNode extends TextNode {
  static getType(): string {
    return "gap";
  }

  static clone(node: GapNode): GapNode {
    return new GapNode(node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedTextNode): GapNode {
    const { text } = serializedNode;
    return new GapNode(text);
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: GapNode.getType(),
      version: 1
    };
  }

  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  createDOM(config): HTMLElement {
    console.log('createDom', this.__text);
    const dom = document.createElement("span");
    dom.style.textDecoration = "underline";
    const textToReplace = this.__text ? "_".repeat(this.__text.length) : "____";
    dom.textContent = textToReplace; // Replace text with underlines
    dom.setAttribute("data-hidden-text", this.__text);
    return dom;
  }

  getHiddenText(): string {
    return this.__text;
  }


  isTextEntity(): boolean {
    return true;
  }
}