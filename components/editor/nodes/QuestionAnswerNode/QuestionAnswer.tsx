import { DecoratorNode } from "lexical";
import QuestionAnswerComponent from "./QuestionAnswerComponent";

export class QuestionAnswerNode extends DecoratorNode<JSX.Element> {
  __question: string;

  constructor(question: string, key?: string) {
    super(key);
    this.__question = question;
  }

  static getType(): string {
    return "question-answer";
  }

  static clone(node: QuestionAnswerNode): QuestionAnswerNode {
    return new QuestionAnswerNode(node.__question, node.__key);
  }

  static importJSON(serializedNode: any): QuestionAnswerNode {
    const { question } = serializedNode;
    return new QuestionAnswerNode(question);
  }

  exportJSON(): any {
    return {
      type: "question-answer",
      version: 1,
      question: this.__question,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <QuestionAnswerComponent question={this.__question} />;
  }
}

export function $createQuestionAnswerNode(question: string): QuestionAnswerNode {
  return new QuestionAnswerNode(question);
}
