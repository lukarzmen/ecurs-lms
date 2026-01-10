import {
  $applyNodeReplacement,
  $getNodeByKey,
  DecoratorNode,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
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

  exportDOM(): DOMExportOutput {
    const container = document.createElement('section');
    container.setAttribute('data-lexical-question-answer', 'true');
    container.style.border = '1px solid rgba(0,0,0,0.15)';
    container.style.borderRadius = '10px';
    container.style.padding = '12px 14px';
    container.style.margin = '12px 0';

    const header = document.createElement('h3');
    header.textContent = 'Pytanie';
    header.style.margin = '0 0 8px 0';
    container.appendChild(header);

    const qText = this.__question ? String(this.__question).trim() : '';
    const aText = this.__answer ? String(this.__answer).trim() : '';
    const eText = this.__explanation ? String(this.__explanation).trim() : '';

    if (qText) {
      const q = document.createElement('p');
      q.setAttribute('data-qa', 'question');
      q.textContent = qText;
      q.style.margin = '0 0 10px 0';
      q.style.whiteSpace = 'pre-wrap';
      container.appendChild(q);
    }

    if (eText) {
      const hintLabel = document.createElement('div');
      hintLabel.textContent = 'Wskazówki';
      hintLabel.style.fontWeight = '700';
      hintLabel.style.margin = '0 0 6px 0';
      container.appendChild(hintLabel);

      const e = document.createElement('div');
      e.setAttribute('data-qa', 'explanation');
      e.textContent = eText;
      e.style.margin = '0 0 10px 0';
      e.style.whiteSpace = 'pre-wrap';
      container.appendChild(e);
    }

    if (aText) {
      const answerLabel = document.createElement('div');
      answerLabel.textContent = 'Odpowiedź';
      answerLabel.style.fontWeight = '700';
      answerLabel.style.margin = '0 0 6px 0';
      container.appendChild(answerLabel);

      const a = document.createElement('div');
      a.setAttribute('data-qa', 'answer');
      a.textContent = aText;
      a.style.whiteSpace = 'pre-wrap';
      container.appendChild(a);
    }

    return {element: container};
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
