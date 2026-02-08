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
import QuestionAnswerComponent, { QAItem, QAType } from "./QuestionAnswerComponent";
import { ToCompleteNode } from "../ToCompleteNode";

// Serialized format without transient state
export type SerializedQuestionAnswerNode = Spread<
  {
    question: string;
    answer: string;
    explanation: string | null;
    items?: QAItem[] | null;
    // No isCompleted here
  },
  SerializedLexicalNode
>;

export class QuestionAnswerNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __question: string;
  __answer: string;
  __explanation: string | null;
  __items: QAItem[] | null;
  // Transient state
  public __isCompleted: boolean = false;

  constructor(
    items: QAItem[] | null,
    key?: NodeKey
  ) {
    super(key);
    this.__items = items;
    const firstItem = items?.[0];
    this.__question = firstItem?.question ?? "";
    this.__answer = firstItem?.answer ?? "";
    this.__explanation = firstItem?.explanation ?? null;
    // Transient state defaults are set by class property initializers
  }

  static getType(): string {
    return "question-answer";
  }

  static clone(node: QuestionAnswerNode): QuestionAnswerNode {
    // Clone basic props
    const newNode = new QuestionAnswerNode(
        node.__items,
        node.__key
    );
    // Manually copy transient state
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedQuestionAnswerNode): QuestionAnswerNode {
    // Import without transient state
    const { question, answer, explanation, items } = serializedNode;
    const normalizedItems = Array.isArray(items) && items.length > 0
      ? items
      : (question ? [{ question, answer, explanation: explanation ?? null }] : []);
    return new QuestionAnswerNode(normalizedItems.length > 0 ? normalizedItems : null);
  }

  exportJSON(): SerializedQuestionAnswerNode {
    // Export without transient state
    const normalizedItems = Array.isArray(this.__items) && this.__items.length > 0
      ? this.__items
      : (this.__question ? [{
          question: this.__question,
          answer: this.__answer,
          explanation: this.__explanation ?? null,
        }] : []);
    const fallbackItem = normalizedItems[0];
    return {
      type: "question-answer",
      version: 1,
      question: fallbackItem?.question ?? this.__question,
      answer: fallbackItem?.answer ?? this.__answer,
      explanation: fallbackItem?.explanation ?? this.__explanation,
      items: normalizedItems.length > 0 ? normalizedItems : null,
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
    const items = Array.isArray(this.__items) && this.__items.length > 0
      ? this.__items
      : (qText ? [{ question: qText, answer: aText, explanation: eText || null }] : []);

    if (items.length > 0) {
      if (items.length === 1) {
        const q = document.createElement('p');
        q.setAttribute('data-qa', 'question');
        q.textContent = items[0].question;
        q.style.margin = '0 0 10px 0';
        q.style.whiteSpace = 'pre-wrap';
        container.appendChild(q);
      } else {
        const list = document.createElement('ul');
        list.setAttribute('data-qa', 'questions');
        list.style.margin = '0 0 10px 18px';
        list.style.padding = '0';
        for (const item of items) {
          const li = document.createElement('li');
          li.textContent = String(item.question);
          li.style.margin = '0 0 6px 0';
          li.style.whiteSpace = 'pre-wrap';
          list.appendChild(li);
        }
        container.appendChild(list);
      }
    }

    if (items.length === 1 && items[0].explanation) {
      const hintLabel = document.createElement('div');
      hintLabel.textContent = 'Wskazówki';
      hintLabel.style.fontWeight = '700';
      hintLabel.style.margin = '0 0 6px 0';
      container.appendChild(hintLabel);

      const e = document.createElement('div');
      e.setAttribute('data-qa', 'explanation');
      e.textContent = String(items[0].explanation);
      e.style.margin = '0 0 10px 0';
      e.style.whiteSpace = 'pre-wrap';
      container.appendChild(e);
    }

    if (items.length === 1 && items[0].answer) {
      const answerLabel = document.createElement('div');
      answerLabel.textContent = 'Odpowiedź';
      answerLabel.style.fontWeight = '700';
      answerLabel.style.margin = '0 0 6px 0';
      container.appendChild(answerLabel);

      const a = document.createElement('div');
      a.setAttribute('data-qa', 'answer');
      a.textContent = String(items[0].answer);
      a.style.whiteSpace = 'pre-wrap';
      container.appendChild(a);
    } else if (items.length > 1) {
      const answerLabel = document.createElement('div');
      answerLabel.textContent = 'Odpowiedzi';
      answerLabel.style.fontWeight = '700';
      answerLabel.style.margin = '0 0 6px 0';
      container.appendChild(answerLabel);

      const answersList = document.createElement('ul');
      answersList.setAttribute('data-qa', 'answers');
      answersList.style.margin = '0 0 10px 18px';
      answersList.style.padding = '0';
      for (const item of items) {
        const li = document.createElement('li');
        li.textContent = String(item.answer);
        li.style.margin = '0 0 6px 0';
        li.style.whiteSpace = 'pre-wrap';
        if (item.explanation) {
          const exp = document.createElement('div');
          exp.textContent = `Wyjasnienie: ${String(item.explanation)}`;
          exp.style.margin = '4px 0 0 0';
          exp.style.whiteSpace = 'pre-wrap';
          li.appendChild(exp);
        }
        answersList.appendChild(li);
      }
      container.appendChild(answersList);
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
          items={this.__items}
            initialCompleted={this.__isCompleted}
            // Pass bound update method
            onComplete={(isCorrect) => this.setCompleted(isCorrect, editor)}
        />
    );
  }
}

export function $createQuestionAnswerNode(qa: QAType): QuestionAnswerNode {
  const normalizedItems = Array.isArray(qa.items)
    ? qa.items.filter((item) => item.question.trim() !== '' && item.answer.trim() !== '')
    : [];
  return $applyNodeReplacement(
    new QuestionAnswerNode(normalizedItems.length > 0 ? normalizedItems : null)
  );
}

// Type guard
export function $isQuestionAnswerNode(node: any): node is QuestionAnswerNode {
    return node instanceof QuestionAnswerNode;
}
