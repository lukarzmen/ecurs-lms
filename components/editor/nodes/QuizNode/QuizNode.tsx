import { Suspense } from "react";
import QuizComponent, { Test } from "./QuizComponent";
import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread, LexicalEditor, $getNodeByKey, EditorConfig, $applyNodeReplacement } from "lexical";
import { ToCompleteNode } from "../ToCompleteNode";


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
    return (
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
