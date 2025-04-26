import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread, LexicalEditor, EditorConfig, $getNodeByKey, $applyNodeReplacement } from "lexical";
import QuestionAnswerComponent, { QAType } from "./QuestionAnswerComponent";
import { ToCompleteNode } from "../ToCompleteNode";

// Serialized format without transient state
export type SerializedQuestionAnswerNode = Spread<
  {
    question: string;
    answer: string;
    explanation: string | null;
    // No isCompleted here
  },
  SerializedLexicalNode
>;

export class QuestionAnswerNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __question: string;
  __answer: string;
  __explanation: string | null;
  // Transient state
  public __isCompleted: boolean = false;

  constructor(
      question: string,
      answer: string,
      explanation: string | null,
      key?: NodeKey
    ) {
    super(key);
    this.__question = question;
    this.__answer = answer;
    this.__explanation = explanation;
    // Transient state defaults are set by class property initializers
  }

  static getType(): string {
    return "question-answer";
  }

  static clone(node: QuestionAnswerNode): QuestionAnswerNode {
    // Clone basic props
    const newNode = new QuestionAnswerNode(
        node.__question,
        node.__answer,
        node.__explanation,
        node.__key
    );
    // Manually copy transient state
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedQuestionAnswerNode): QuestionAnswerNode {
    // Import without transient state
    const { question, answer, explanation } = serializedNode;
    return new QuestionAnswerNode(question, answer, explanation);
  }

  exportJSON(): SerializedQuestionAnswerNode {
    // Export without transient state
    return {
      type: "question-answer",
      version: 1,
      question: this.__question,
      answer: this.__answer,
      explanation: this.__explanation,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    const className = config.theme.questionAnswer || 'question-answer-node';
    element.className = className;
    return element;
  }

  updateDOM(prevNode: QuestionAnswerNode, dom: HTMLElement, config: EditorConfig): boolean {
    // Component handles updates
    return false;
  }

  // Method to update the transient completion state
  setCompleted(completed: boolean, editor: LexicalEditor): void {
      editor.update(() => {
          const currentNode = $getNodeByKey(this.getKey());
          if ($isQuestionAnswerNode(currentNode)) {
              const writable = currentNode.getWritable();
              writable.__isCompleted = completed;
          }
      });
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
        <QuestionAnswerComponent
            question={this.__question}
            answer={this.__answer}
            explanation={this.__explanation}
            initialCompleted={this.__isCompleted}
            // Pass bound update method
            onComplete={(isCorrect) => this.setCompleted(isCorrect, editor)}
        />
    );
  }
}

export function $createQuestionAnswerNode(qa: QAType): QuestionAnswerNode {
  return $applyNodeReplacement(new QuestionAnswerNode(qa.question, qa.answer, qa.explanation));
}

// Type guard
export function $isQuestionAnswerNode(node: any): node is QuestionAnswerNode {
    return node instanceof QuestionAnswerNode;
}
