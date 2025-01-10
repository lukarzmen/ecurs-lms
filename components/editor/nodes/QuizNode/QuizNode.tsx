import { Suspense } from "react";
import QuizComponent from "./QuizComponent";
import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import { t } from "@excalidraw/excalidraw/types/i18n";

export type SerializedQuizNode = Spread<
  {
    question: string;
    answers: string[];
    correctAnswerDescription: string | null;
    correctAnswerIndex: number;
  },
  SerializedLexicalNode
>;

export class QuizNode extends DecoratorNode<JSX.Element> {
  __question: string;
  __answers: string[];
  __correctAnswerIndex: number;
  __correctAnswerDescription: string | null;

  static getType(): string {
    return 'quiz';
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    return element;
  }

  static clone(node: QuizNode): QuizNode {
    return new QuizNode(node.__question, node.__answers, node.__correctAnswerIndex, node.__correctAnswerDescription, node.__key);
  }

  static importJSON(serializedNode: SerializedQuizNode): QuizNode {
    return new QuizNode(
      serializedNode.question,
      serializedNode.answers,
      serializedNode.correctAnswerIndex,
      serializedNode.correctAnswerDescription,
    );
  }

  constructor(question: string, answers: string[], correctAnswerIndex: number, correctAnswerDescription: string | null, key?: NodeKey) {
    super(key);
    this.__question = question;
    this.__answers = answers;
    this.__correctAnswerIndex = correctAnswerIndex;
    this.__correctAnswerDescription = correctAnswerDescription;
  }

  exportJSON(): SerializedQuizNode {
    return {
      question: this.__question,
      answers: this.__answers,
      correctAnswerIndex: this.__correctAnswerIndex,
      correctAnswerDescription: this.__correctAnswerDescription,
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
          correctAnswerDescription={this.__correctAnswerDescription}
        />
      </Suspense>
    );
  }
}
