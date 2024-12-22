import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import * as React from 'react';
import {Suspense} from 'react';

export type Options = ReadonlyArray<Option>;

export type Option = Readonly<{
  text: string;
  uid: string;
  votes: Array<number>;
}>;

const QuizComponent = React.lazy(() => import('./PollComponent'));

function createUID(): string {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5);
}

export function createQuizOption(text = ''): Option {
  return {
    text,
    uid: createUID(),
    votes: [],
  };
}

function cloneOption(
  option: Option,
  text: string,
  votes?: Array<number>,
): Option {
  return {
    text,
    uid: option.uid,
    votes: votes || Array.from(option.votes),
  };
}

export type SerializedQuizNode = Spread<
  {
    question: string;
    options: Options;
  },
  SerializedLexicalNode
>;

function $convertQuizElement(domNode: HTMLElement): DOMConversionOutput | null {
  const question = domNode.getAttribute('data-lexical-quiz-question');
  const options = domNode.getAttribute('data-lexical-quiz-options');
  if (question !== null && options !== null) {
    const node = $createQuizNode(question, JSON.parse(options));
    return {node};
  }
  return null;
}

export class QuizNode extends DecoratorNode<JSX.Element> {
  __question: string;
  __options: Options;

  static getType(): string {
    return 'quiz';
  }

  static clone(node: QuizNode): QuizNode {
    return new QuizNode(node.__question, node.__options, node.__key);
  }

  static importJSON(serializedNode: SerializedQuizNode): QuizNode {
    const node = $createQuizNode(
      serializedNode.question,
      serializedNode.options,
    );
    serializedNode.options.forEach(node.addOption);
    return node;
  }

  constructor(question: string, options: Options, key?: NodeKey) {
    super(key);
    this.__question = question;
    this.__options = options;
  }

  exportJSON(): SerializedQuizNode {
    return {
      options: this.__options,
      question: this.__question,
      type: 'quiz',
      version: 1,
    };
  }

  addOption(option: Option): void {
    const self = this.getWritable();
    const options = Array.from(self.__options);
    options.push(option);
    self.__options = options;
  }

  deleteOption(option: Option): void {
    const self = this.getWritable();
    const options = Array.from(self.__options);
    const index = options.indexOf(option);
    options.splice(index, 1);
    self.__options = options;
  }

  setOptionText(option: Option, text: string): void {
    const self = this.getWritable();
    const clonedOption = cloneOption(option, text);
    const options = Array.from(self.__options);
    const index = options.indexOf(option);
    options[index] = clonedOption;
    self.__options = options;
  }

  toggleVote(option: Option, clientID: number): void {
    const self = this.getWritable();
    const votes = option.votes;
    const votesClone = Array.from(votes);
    const voteIndex = votes.indexOf(clientID);
    if (voteIndex === -1) {
      votesClone.push(clientID);
    } else {
      votesClone.splice(voteIndex, 1);
    }
    const clonedOption = cloneOption(option, option.text, votesClone);
    const options = Array.from(self.__options);
    const index = options.indexOf(option);
    options[index] = clonedOption;
    self.__options = options;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-quiz-question')) {
          return null;
        }
        return {
          conversion: $convertQuizElement,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-quiz-question', this.__question);
    element.setAttribute(
      'data-lexical-quiz-options',
      JSON.stringify(this.__options),
    );
    return {element};
  }

  createDOM(): HTMLElement {
    const elem = document.createElement('span');
    elem.style.display = 'inline-block';
    return elem;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <QuizComponent
          question={this.__question}
          options={this.__options}
          nodeKey={this.__key}
        />
      </Suspense>
    );
  }
}

export function $createQuizNode(question: string, options: Options): QuizNode {
  return new QuizNode(question, options);
}

export function $isTestNode(
  node: LexicalNode | null | undefined,
): node is QuizNode {
  return node instanceof QuizNode;
}
