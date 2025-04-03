import { DecoratorNode } from "lexical";
import DoTaskComponent from "./DoTaskComponent";
import exp from "constants";
import { DoTaskType } from "../../plugins/TaskPlugin";


export class DoTaskNode extends DecoratorNode<JSX.Element> {
  __task: string;
  __hint: string | null;

  constructor(task: string, hint: string | null, key?: string) {
    super(key);
    this.__task = task;
    this.__hint = hint;
  }

  static getType(): string {
    return "do-task";
  }

  static clone(node: DoTaskNode): DoTaskNode {
    return new DoTaskNode(node.__task, node.__hint, node.__key);
  }

  static importJSON(serializedNode: any): DoTaskNode {
    const { task, hint} = serializedNode;
    return new DoTaskNode(task, hint);
  }

  exportJSON(): any {
    return {
      type: "do-task",
      version: 1,
      task: this.__task,
      hint: this.__hint
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(prevNode: DoTaskNode): boolean {
    return false;
  }
  decorate(): JSX.Element {
    return <DoTaskComponent task={this.__task} hint={this.__hint}/>;
  }
}

export function createDoTaskNode(qa: DoTaskType): DoTaskNode {
  return new DoTaskNode(qa.task, qa.hint);
}
