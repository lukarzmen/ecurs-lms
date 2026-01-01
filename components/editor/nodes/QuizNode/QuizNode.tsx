import { Suspense } from "react";
import QuizComponent, { Test } from "./QuizComponent";
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

// Serialized format for the whole quiz (array of tests)
export type SerializedQuizNode = Spread<
  {
    tests: Test[];
    // No isCompleted here
  },
  SerializedLexicalNode
>;

export class QuizNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
  __tests: Test[];
  public __isCompleted: boolean = false;

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
    const newNode = new QuizNode(node.__tests, node.__key);
    newNode.__isCompleted = node.__isCompleted;
    return newNode;
  }

  static importJSON(serializedNode: SerializedQuizNode): QuizNode {
    return new QuizNode(serializedNode.tests);
  }

  updateDOM(prevNode: QuizNode, dom: HTMLElement, config: EditorConfig): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const container = document.createElement('div');
    container.setAttribute('data-lexical-quiz', 'true');

    const tests = Array.isArray(this.__tests) ? this.__tests : [];
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const testWrap = document.createElement('div');
      testWrap.setAttribute('data-quiz-index', String(i));

      const q = document.createElement('div');
      q.textContent = test?.question ? String(test.question) : '';
      testWrap.appendChild(q);

      const answers = Array.isArray(test?.answers) ? test.answers : [];
      if (answers.length > 0) {
        const ul = document.createElement('ul');
        for (const a of answers) {
          const li = document.createElement('li');
          li.textContent = String(a);
          ul.appendChild(li);
        }
        testWrap.appendChild(ul);
      }

      if (test?.correctAnswerIndex !== null && test?.correctAnswerIndex !== undefined) {
        testWrap.setAttribute('data-correct-index', String(test.correctAnswerIndex));
      }
      if (test?.correctAnswerDescription) {
        testWrap.setAttribute('data-correct-description', String(test.correctAnswerDescription));
      }

      container.appendChild(testWrap);
    }

    return {element: container};
  }

  getTextContent(): string {
    const tests = Array.isArray(this.__tests) ? this.__tests : [];
    const lines: string[] = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const question = test?.question ? String(test.question).trim() : '';
      if (question) {
        lines.push(question);
      }

      const answers = Array.isArray(test?.answers) ? test.answers : [];
      for (const a of answers) {
        const answer = String(a).trim();
        if (answer) {
          lines.push(`- ${answer}`);
        }
      }
    }

    return lines.join('\n');
  }

  constructor(
    tests: Test[],
    key?: NodeKey
  ) {
    super(key);
    this.__tests = tests;
  }

  setCompleted(completed: boolean, editor: LexicalEditor): void {
    editor.update(() => {
      const currentNode = $getNodeByKey(this.getKey());
      if ($isQuizNode(currentNode)) {
        const writable = currentNode.getWritable();
        writable.__isCompleted = completed;
      }
    });
  }

  exportJSON(): SerializedQuizNode {
    return {
      tests: this.__tests,
      type: 'quiz',
      version: 1,
    };
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return withNodeErrorBoundary(
      <Suspense fallback={null}>
        <QuizComponent
          tests={this.__tests}
          onComplete={() => this.setCompleted(true, editor)}
        />
      </Suspense>
    );
  }
}

export function $createQuizNode(tests: Test[]): QuizNode {
  return $applyNodeReplacement(new QuizNode(tests));
}

export function $isQuizNode(node: any): node is QuizNode {
  return node instanceof QuizNode;
}
