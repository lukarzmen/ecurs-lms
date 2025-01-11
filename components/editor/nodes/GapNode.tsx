import { TextNode, SerializedTextNode, NodeKey } from "lexical";
import ReactDOMServer from 'react-dom/server';

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
      version: 1,
    };
  }

  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  createDOM(): HTMLElement {
    // Create a span element with Tailwind styling and JSX rendering
    const span = (
      <span
        className="underline"
        data-hidden-text={this.__text}
      >
        {this.__text ? "_".repeat(this.__text.length) : "____"}
      </span>
    );

    // Convert JSX to DOM element
    const container = document.createElement("div");
    container.innerHTML = ReactDOMServer.renderToStaticMarkup(span);

    // Return the first child as the actual span element
    return container.firstChild as HTMLElement;
  }

  getHiddenText(): string {
    return this.__text;
  }

  isTextEntity(): boolean {
    return true;
  }
}
