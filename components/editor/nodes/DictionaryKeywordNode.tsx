import { TextNode, SerializedTextNode, NodeKey } from "lexical";

export type SerializedGapNode = SerializedTextNode & {
  hiddenText: string;
};

export class DictionaryKeywordNode extends TextNode {
  static getType(): string {
    return "dictionary-keyword";
  }

  static clone(node: DictionaryKeywordNode): DictionaryKeywordNode {
    return new DictionaryKeywordNode(node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedTextNode): DictionaryKeywordNode {
    const { text } = serializedNode;
    return new DictionaryKeywordNode(text, "");
  }

  exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: DictionaryKeywordNode.getType(),
      version: 1
    };
  }

  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  createDOM(config): HTMLElement {
    const dom = document.createElement("span");
    dom.style.backgroundColor = "yellow"; // Highlighted background
    dom.style.cursor = "pointer";
    dom.textContent = this.__text; // Display the original text
    dom.setAttribute("data-description", "hidentext");
    dom.title = "hidentext"; // Tooltip for description
    return dom;
  }

  getHiddenText(): string {
    return this.__text;
  }


  isTextEntity(): boolean {
    return true;
  }
}