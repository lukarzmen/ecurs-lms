import { DecoratorNode } from "lexical";
import QuestionAnswerComponent, { QAType } from "./QuestionAnswerComponent";
import exp from "constants";


export class QuestionAnswerNode extends DecoratorNode<JSX.Element> {
  __question: string;
  __answer: string;
  __explanation: string | null;

  constructor(question: string, answer: string, explaination: string | null, key?: string) {
    super(key);
    this.__question = question;
    this.__answer = answer;
    this.__explanation = explaination;
  }

  static getType(): string {
    return "question-answer";
  }

  static clone(node: QuestionAnswerNode): QuestionAnswerNode {
    return new QuestionAnswerNode(node.__question, node.__answer, node.__explanation, node.__key);
  }

  static importJSON(serializedNode: any): QuestionAnswerNode {
    const { question, answer, explaination } = serializedNode;
    return new QuestionAnswerNode(question, answer, explaination);
  }

  exportJSON(): any {
    return {
      type: "question-answer",
      version: 1,
      question: this.__question,
      answer: this.__answer,
      explaination: this.__explanation
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(prevNode: QuestionAnswerNode): boolean {
    return false;
  }
  decorate(): JSX.Element {
    return <QuestionAnswerComponent question={this.__question} answer={this.__answer} explanation={this.__explanation} />;
  }
}

export function $createQuestionAnswerNode(qa: QAType): QuestionAnswerNode {
  return new QuestionAnswerNode(qa.question, qa.answer, qa.explanation);
}
