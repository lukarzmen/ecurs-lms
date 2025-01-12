import { DecoratorNode } from "lexical";
import QuestionAnswerComponent from "./QuestionAnswerComponent";


export class QuestionAnswerNode extends DecoratorNode<JSX.Element> {
  __question: string;
  __answer: string;

  constructor(question: string, answer: string, key?: string) {
    super(key);
    this.__question = question;
    this.__answer = answer;
  }

  static getType(): string {
    return "question-answer";
  }

  static clone(node: QuestionAnswerNode): QuestionAnswerNode {
    return new QuestionAnswerNode(node.__question, node.__key);
  }

  static importJSON(serializedNode: any): QuestionAnswerNode {
    const { question, answer } = serializedNode;
    return new QuestionAnswerNode(question, answer);
  }

  exportJSON(): any {
    return {
      type: "question-answer",
      version: 1,
      question: this.__question,
      answer: this.__answer,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <QuestionAnswerComponent question={this.__question} answer={this.__answer} />;
  }
}

export function $createQuestionAnswerNode(qa: QAType): QuestionAnswerNode {
  return new QuestionAnswerNode(qa.question, qa.answer);
}
