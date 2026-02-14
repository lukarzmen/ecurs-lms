import { Suspense } from "react";
import TrueFalseComponent, { TrueFalseQuestion } from "./TrueFalseComponent";
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
import { ToCompleteNode } from "../ToCompleteNode";
import { withNodeErrorBoundary } from "../Error/BrokenNode";

export type SerializedTrueFalseNode = Spread<
  {
    questions: TrueFalseQuestion[];
  },
  SerializedLexicalNode
>;

function normalizeQuestions(questions: TrueFalseQuestion[]): TrueFalseQuestion[] {
  return (Array.isArray(questions) ? questions : [])
    .map((item) => {
      const question = typeof item?.question === "string" ? item.question.trim() : "";
      if (!question) return null;
      const correctAnswer = Boolean(item?.correctAnswer);
      const explanation =
        item?.explanation === null || item?.explanation === undefined
          ? null
          : typeof item?.explanation === "string"
            ? item.explanation.trim() || null
            : null;
      return { question, correctAnswer, explanation } satisfies TrueFalseQuestion;
    })
    .filter(Boolean) as TrueFalseQuestion[];
}

export class TrueFalseNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __questions: TrueFalseQuestion[];
  __selections: Array<boolean | null> = [];
  public __isCompleted: boolean = false;

  static getType(): string {
    return "true-false";
  }

  static clone(node: TrueFalseNode): TrueFalseNode {
    const newNode = new TrueFalseNode(node.__questions, node.__key);
    newNode.__selections = [...node.__selections];
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedTrueFalseNode): TrueFalseNode {
    return new TrueFalseNode(normalizeQuestions(serializedNode.questions));
  }

  exportJSON(): SerializedTrueFalseNode {
    return {
      questions: this.__questions,
      type: "true-false",
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    const className = config.theme.trueFalse || "true-false-node";
    element.className = className;
    return element;
  }

  updateDOM(prevNode: TrueFalseNode, dom: HTMLElement, config: EditorConfig): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const container = document.createElement("section");
    container.setAttribute("data-lexical-true-false", "true");

    const header = document.createElement("h2");
    header.textContent = "Prawda / fałsz";
    container.appendChild(header);

    const questions = Array.isArray(this.__questions) ? this.__questions : [];
    if (questions.length > 0) {
      const ol = document.createElement("ol");
      for (const item of questions) {
        const li = document.createElement("li");
        li.textContent = item?.question ? String(item.question) : "";
        li.setAttribute("data-correct", item.correctAnswer ? "true" : "false");
        if (item?.explanation) {
          li.setAttribute("data-explanation", String(item.explanation));
        }
        ol.appendChild(li);
      }
      container.appendChild(ol);
      
      // Add answer key section
      const answerSection = document.createElement("div");
      answerSection.style.marginTop = "1.5rem";
      answerSection.style.padding = "1rem";
      answerSection.style.border = "1px solid #e5e7eb";
      
      const answerHeader = document.createElement("strong");
      answerHeader.textContent = "Klucz odpowiedzi:";
      answerSection.appendChild(answerHeader);
      
      const answerList = document.createElement("ol");
      answerList.style.marginTop = "0.5rem";
      for (const item of questions) {
        const li = document.createElement("li");
        li.textContent = `${item.correctAnswer ? "Prawda" : "Fałsz"}`;
        
        if (item?.explanation) {
          const explanation = document.createElement("div");
          explanation.style.marginTop = "0.25rem";
          explanation.style.fontStyle = "italic";
          explanation.style.fontSize = "0.875rem";
          explanation.textContent = `Wyjaśnienie: ${String(item.explanation)}`;
          li.appendChild(explanation);
        }
        
        answerList.appendChild(li);
      }
      answerSection.appendChild(answerList);
      container.appendChild(answerSection);
    }

    return { element: container };
  }

  getTextContent(): string {
    const questions = Array.isArray(this.__questions) ? this.__questions : [];
    return questions
      .map((item) => (item?.question ? String(item.question).trim() : ""))
      .filter(Boolean)
      .join("\n");
  }

  constructor(questions: TrueFalseQuestion[], key?: NodeKey) {
    super(key);
    this.__questions = normalizeQuestions(questions);
  }

  setSelections(selections: Array<boolean | null>, editor: LexicalEditor): void {
    editor.update(() => {
      const currentNode = $getNodeByKey(this.getKey());
      if ($isTrueFalseNode(currentNode)) {
        const writable = currentNode.getWritable();
        writable.__selections = selections;
      }
    });
  }

  setCompleted(completed: boolean, editor: LexicalEditor): void {
    editor.update(() => {
      const currentNode = $getNodeByKey(this.getKey());
      if ($isTrueFalseNode(currentNode)) {
        const writable = currentNode.getWritable();
        writable.__isCompleted = completed;
      }
    });
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return withNodeErrorBoundary(
      <Suspense fallback={null}>
        <TrueFalseComponent
          questions={this.__questions}
          initialSelections={this.__selections}
          initialCompleted={this.__isCompleted}
          onSelect={(index, value) => {
            const nextSelections = Array.from(
              { length: this.__questions.length },
              (_, i) => this.__selections?.[i] ?? null,
            );
            nextSelections[index] = value;
            this.setSelections(nextSelections, editor);
          }}
          onComplete={(isCorrect) => this.setCompleted(isCorrect, editor)}
        />
      </Suspense>
    );
  }
}

export function $createTrueFalseNode(questions: TrueFalseQuestion[]): TrueFalseNode {
  return $applyNodeReplacement(new TrueFalseNode(questions));
}

export function $isTrueFalseNode(node: any): node is TrueFalseNode {
  return node instanceof TrueFalseNode;
}
