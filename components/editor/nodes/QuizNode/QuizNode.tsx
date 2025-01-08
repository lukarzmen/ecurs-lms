import { Suspense } from "react";
import QuizComponent from "./QuizComponent";
import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";

export type SerializedQuizNode = Spread<
  {
    question: string;
    answers: string[];
    correctAnswerIndex: number;
  },
  SerializedLexicalNode
>;

export class QuizNode extends DecoratorNode<JSX.Element> {
  __question: string;
  __answers: string[];
  __correctAnswerIndex: number;

  static getType(): string {
    return 'quiz';
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    return element;
  }

  static clone(node: QuizNode): QuizNode {
    return new QuizNode(node.__question, node.__answers, node.__correctAnswerIndex, node.__key);
  }

  static importJSON(serializedNode: SerializedQuizNode): QuizNode {
    return new QuizNode(
      serializedNode.question,
      serializedNode.answers,
      serializedNode.correctAnswerIndex,
    );
  }

  constructor(question: string, answers: string[], correctAnswerIndex: number, key?: NodeKey) {
    super(key);
    this.__question = question;
    this.__answers = answers;
    this.__correctAnswerIndex = correctAnswerIndex;
  }

  exportJSON(): SerializedQuizNode {
    return {
      question: this.__question,
      answers: this.__answers,
      correctAnswerIndex: this.__correctAnswerIndex,
      type: 'quiz',
      version: 1,
    };
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <QuizComponent
          question={this.__question}
          answers={this.__answers}
          correctAnswerIndex={this.__correctAnswerIndex}
          nodeKey={this.__key}
        />
      </Suspense>
    );
  }
}
