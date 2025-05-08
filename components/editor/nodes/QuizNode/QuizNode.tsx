import { Suspense } from "react";
import QuizComponent from "./QuizComponent";
import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread, LexicalEditor, $getNodeByKey, EditorConfig, $applyNodeReplacement } from "lexical"; // Import necessary types
import { ToCompleteNode } from "../ToCompleteNode";

// Serialized format *without* transient state
export type SerializedQuizNode = Spread<
  {
    question: string;
    answers: string[];
    correctAnswerDescription: string | null;
    correctAnswerIndex: number;
    // No isCompleted here
  },
  SerializedLexicalNode
>;

export class QuizNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __question: string;
  __answers: string[];
  __correctAnswerIndex: number;
  __correctAnswerDescription: string | null;
  // Transient state
  public __isCompleted: boolean = false; // Initialized to false

  static getType(): string {
    return 'quiz';
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    const className = config.theme.quiz || 'quiz-node';
    element.className = className;
    return element;
  }

  static clone(node: QuizNode): QuizNode {
    // Clone basic props
    const newNode = new QuizNode(
        node.__question,
        node.__answers,
        node.__correctAnswerIndex,
        node.__correctAnswerDescription,
        node.__key
    );
    // Manually copy transient state for clone operations (undo/redo)
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedQuizNode): QuizNode {
    // Import *without* transient state. It will use the default (false).
    return new QuizNode(
      serializedNode.question,
      serializedNode.answers,
      serializedNode.correctAnswerIndex,
      serializedNode.correctAnswerDescription
    );
  }

  updateDOM(prevNode: QuizNode, dom: HTMLElement, config: EditorConfig): boolean {
     // Component handles updates
    return false;
  }

  constructor(
      question: string,
      answers: string[],
      correctAnswerIndex: number,
      correctAnswerDescription: string | null,
      // Remove isCompleted from constructor parameters
      key?: NodeKey
    ) {
    super(key);
    this.__question = question;
    this.__answers = answers;
    this.__correctAnswerIndex = correctAnswerIndex;
    this.__correctAnswerDescription = correctAnswerDescription;
    // Transient state defaults are set by class property initializer (__isCompleted = false)
  }

  // Method to update the transient completion state within the node
  setCompleted(completed: boolean, editor: LexicalEditor): void {
      editor.update(() => {
          // Ensure we get the latest version of the node
          const currentNode = $getNodeByKey(this.getKey());
          if ($isQuizNode(currentNode)) { // Use type guard
              const writable = currentNode.getWritable();
              writable.__isCompleted = completed;
          }
      });
  }

  exportJSON(): SerializedQuizNode {
    // Export *without* transient state
    return {
      question: this.__question,
      answers: this.__answers,
      correctAnswerIndex: this.__correctAnswerIndex,
      correctAnswerDescription: this.__correctAnswerDescription,
      // No isCompleted here
      type: 'quiz',
      version: 1,
    };
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <Suspense fallback={null}>
        <QuizComponent
          question={this.__question}
          answers={this.__answers}
          correctAnswerIndex={this.__correctAnswerIndex}
          nodeKey={this.__key}
          correctAnswerDescription={this.__correctAnswerDescription}
          // Pass the bound update method
          onComplete={(_) => this.setCompleted(true, editor)}
        />
      </Suspense>
    );
  }
}

// Helper function to create the node
export function $createQuizNode(
    question: string,
    answers: string[],
    correctAnswerIndex: number,
    correctAnswerDescription: string | null
): QuizNode {
    // Constructor no longer takes isCompleted
    return $applyNodeReplacement(
        new QuizNode(question, answers, correctAnswerIndex, correctAnswerDescription)
    );
}

// Type guard
export function $isQuizNode(node: any): node is QuizNode {
    return node instanceof QuizNode;
}
