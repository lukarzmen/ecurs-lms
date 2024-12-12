import { DecoratorNode, SerializedLexicalNode, Spread } from "lexical";

export type SerializedGapNode = Spread<
  {
    hiddenText: string;
  },
  SerializedLexicalNode
>;

export class GapNode extends DecoratorNode<JSX.Element> {
  __hiddenText: string;

  static getType(): string {
    return "gap";
  }

  static clone(node: GapNode): GapNode {
    return new GapNode(node.__hiddenText, node.__key);
  }

  static importJSON(serializedNode: SerializedGapNode): GapNode {
    return new GapNode(serializedNode.hiddenText);
  }

  exportJSON(): SerializedGapNode {
    return {
      type: GapNode.getType(),
      version: 1, // Ensure a `version` field is added for compatibility.
      hiddenText: this.__hiddenText,
    };
  }

  constructor(hiddenText: string, key?: string) {
    super(key);
    this.__hiddenText = hiddenText;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.style.textDecoration = "underline";
    span.dataset.hiddenText = this.__hiddenText;
    span.contentEditable = "false";
    span.innerText = "_____";
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <span
        style={{ textDecoration: "underline" }}
        data-hidden-text={this.__hiddenText}
        contentEditable="false"
      >
        _____
      </span>
    );
  }
}
