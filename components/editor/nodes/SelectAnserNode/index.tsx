import { DecoratorNode, NodeKey, $getNodeByKey, EditorConfig, LexicalEditor, $applyNodeReplacement, SerializedLexicalNode, Spread } from "lexical";
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
