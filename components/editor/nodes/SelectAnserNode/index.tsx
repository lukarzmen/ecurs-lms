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
import React from "react";
import { SelectAnswerComponent } from "./SelectAnswerComponent";
import { ToCompleteNode } from "../ToCompleteNode";

export interface SelectableAnswerNodeProps {
    options: string[];
    selectedIndex: number;
}

// Interface for the serialized format (without transient state)
export type SerializedSelectAnswerNode = Spread<
    {
        answers: string[];
        correctAnswerIndex: number;
        // No selectedAnswer or isCompleted here
    },
    SerializedLexicalNode
>;


export class SelectAnswerNode extends DecoratorNode<JSX.Element> implements ToCompleteNode {
    private __answers: string[];
    private __correctAnswerIndex: number;
    // Transient state (in-memory only) - Node's view
    private __selectedAnswer: string | null = null;
    public __isCompleted: boolean = false; // Node's persistent completion state

    constructor(
        selectAnswerNodeProps: SelectableAnswerNodeProps,
        key?: NodeKey
    ) {
        super(key);
        this.__answers = selectAnswerNodeProps.options;
        this.__correctAnswerIndex = selectAnswerNodeProps.selectedIndex;
        // Transient state defaults are set by class property initializers
    }

    static getType(): string {
        return "select-answer-quiz";
    }

    static clone(node: SelectAnswerNode): SelectAnswerNode {
        // Clone basic props
        const newNode = new SelectAnswerNode(
            { options: node.__answers, selectedIndex: node.__correctAnswerIndex },
            node.__key
        );
        // Manually copy transient state for clone operations (undo/redo)
        newNode.__selectedAnswer = node.__selectedAnswer;
        newNode.__isCompleted = node.__isCompleted;
        return newNode;
    }

    static importJSON(serializedNode: SerializedSelectAnswerNode): SelectAnswerNode {
        // Import *without* transient state. It will use defaults.
        const { answers, correctAnswerIndex } = serializedNode;
        return new SelectAnswerNode({ options: answers, selectedIndex: correctAnswerIndex });
    }

    exportJSON(): SerializedSelectAnswerNode {
        // Export *without* transient state
        return {
            type: "select-answer-quiz",
            version: 1,
            answers: this.__answers,
            correctAnswerIndex: this.__correctAnswerIndex,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement("span");
        const className = config.theme.selectAnswer || 'select-answer-quiz-node';
        span.className = className;
        return span;
    }

    updateDOM(): boolean {
        // Component handles updates
        return false;
    }

    exportDOM(): DOMExportOutput {
        const container = document.createElement('section');
        container.setAttribute('data-lexical-select-answer', 'true');
        container.setAttribute('data-correct-index', String(this.__correctAnswerIndex));
        if (this.__selectedAnswer !== null) {
            container.setAttribute('data-selected', this.__selectedAnswer);
        }

        container.style.border = '1px solid rgba(0,0,0,0.15)';
        container.style.borderRadius = '10px';
        container.style.padding = '12px 14px';
        container.style.margin = '12px 0';

        const header = document.createElement('h3');
        header.textContent = 'Wybierz poprawną odpowiedź';
        header.style.margin = '0 0 8px 0';
        container.appendChild(header);

        const answers = Array.isArray(this.__answers) ? this.__answers : [];
        if (answers.length > 0) {
            const ol = document.createElement('ol');
            ol.type = 'a';
            ol.style.margin = '0 0 10px 18px';
            ol.style.padding = '0';

            for (const a of answers) {
                const li = document.createElement('li');
                li.textContent = a !== null && a !== undefined ? String(a) : '';
                li.style.margin = '0 0 6px 0';
                li.style.whiteSpace = 'pre-wrap';
                ol.appendChild(li);
            }

            container.appendChild(ol);
        }

        // Answer key at the end (for PDF/HTML export)
        const idx = this.__correctAnswerIndex;
        const hasCorrect = Number.isFinite(Number(idx)) && Number(idx) >= 0 && Number(idx) < answers.length;
        if (hasCorrect) {
            const answerSection = document.createElement('div');
            answerSection.style.marginTop = '8px';
            answerSection.style.paddingTop = '10px';
            answerSection.style.borderTop = '1px solid rgba(0,0,0,0.12)';

            const label = document.createElement('div');
            label.textContent = 'Poprawna odpowiedź';
            label.style.fontWeight = '700';
            label.style.margin = '0 0 6px 0';
            answerSection.appendChild(label);

            const correctLetter = String.fromCharCode(97 + Number(idx));
            const correctText = answers[Number(idx)] !== null && answers[Number(idx)] !== undefined
                ? String(answers[Number(idx)])
                : '';
            const value = document.createElement('div');
            value.textContent = `${correctLetter}) ${correctText}`.trim();
            value.style.whiteSpace = 'pre-wrap';
            answerSection.appendChild(value);

            container.appendChild(answerSection);
        }

        return { element: container };
    }

    getTextContent(): string {
        const lines: string[] = [];
        for (const a of this.__answers) {
            const answer = String(a).trim();
            if (answer) lines.push(`- ${answer}`);
        }
        return lines.join('\n');
    }

    // Method to update the node's selected answer state
    setSelectedAnswer(answer: string | null, editor: LexicalEditor): void {
         editor.update(() => {
            const currentNode = $getNodeByKey(this.getKey());
            if ($isSelectAnswerNode(currentNode)) {
                const writable = currentNode.getWritable();
                // Only update selected answer, don't touch isCompleted here
                writable.__selectedAnswer = answer;
            }
        });
    }

    // Method called by the component to update the node's completion state
    setCompletionStatus(isCorrect: boolean, editor: LexicalEditor): void {
        editor.update(() => {
            const currentNode = $getNodeByKey(this.getKey());
             if ($isSelectAnswerNode(currentNode)) {
                const writable = currentNode.getWritable();
                // Update the node's persistent completion state
                writable.__isCompleted = isCorrect;
             }
        });
    }

    // REMOVED checkAnswer method


    decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
        // Pass node state and bound methods down to the component
        return (
            <SelectAnswerComponent
                answers={this.__answers}
                correctAnswerIndex={this.__correctAnswerIndex}
                initialSelectedAnswer={this.__selectedAnswer} // Pass current selection state as initial
                isNodeCompleted={this.__isCompleted} // Pass node's completion state for disabling
                nodeKey={this.__key}
                // Pass method to update node's selected answer
                onSelect={(answer) => this.setSelectedAnswer(answer, editor)}
                // Pass method to update node's completion status
                onComplete={(isCorrect) => this.setCompletionStatus(isCorrect, editor)}
                // REMOVED onCheck prop
            />
        );
    }
}

export function $createSelectAnswerNode(props: SelectableAnswerNodeProps): SelectAnswerNode {
    return $applyNodeReplacement(new SelectAnswerNode(props));
}

export function $isSelectAnswerNode(node: any): node is SelectAnswerNode {
    return node instanceof SelectAnswerNode;
}
