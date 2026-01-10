import { DecoratorNode, DOMExportOutput, SerializedLexicalNode, SerializedTextNode, Spread } from "lexical";
import React, { useState } from "react";
import { BookOpen, X, Info } from "lucide-react";

export type SerializedDescriptionNode = Spread<
  {
    text: string;
    definition: string;
  },
  SerializedLexicalNode
>;

export class DescriptionNode extends DecoratorNode<JSX.Element> {
  __text: string;
  __definition: string;

  constructor(text: string, definition: string, key?: string) {
    super(key);
    this.__text = text;
    this.__definition = definition;
  }

  static getType(): string {
    return "description";
  }

  static clone(node: DescriptionNode): DescriptionNode {
    return new DescriptionNode(node.__text, node.__definition, node.__key);
  }

  static importJSON(serializedNode: SerializedDescriptionNode): DescriptionNode {
    const { text, definition } = serializedNode;
    return new DescriptionNode(text, definition);
  }

  exportJSON(): SerializedDescriptionNode {
    return {
      text: this.__text,
      definition: this.__definition,
      type: "description",
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const container = document.createElement('aside');
    container.setAttribute('data-lexical-description', 'true');
    // Neutral styling for export (HTML/PDF). Uses mostly current text color.
    container.style.border = '1px solid rgba(0,0,0,0.15)';
    container.style.borderRadius = '10px';
    container.style.padding = '12px 14px';
    container.style.margin = '12px 0';

    const label = document.createElement('div');
    label.textContent = 'Wyjaśnienie';
    label.style.fontWeight = '700';
    label.style.marginBottom = '6px';
    container.appendChild(label);

    const termText = this.__text ? String(this.__text) : '';
    if (termText) {
      const term = document.createElement('div');
      term.textContent = termText;
      term.style.fontWeight = '600';
      term.style.marginBottom = '6px';
      container.appendChild(term);
    }

    const defText = this.__definition ? String(this.__definition) : '';
    if (defText) {
      const def = document.createElement('div');
      def.textContent = defText;
      def.style.whiteSpace = 'pre-wrap';
      container.appendChild(def);
    }

    return {element: container};
  }

  decorate(): JSX.Element {
    return <DescriptionComponent text={this.__text} definition={this.__definition} />;
  }
}

export function $createDefinitionNode(text: string, definition: string): DescriptionNode {
  return new DescriptionNode(text, definition);
}

export type DescriptionComponentProps = {
  text: string;
  definition: string;
};

export function DescriptionComponent({ text, definition }: DescriptionComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shortDefinition = definition.split(" ").slice(0, 12).join(" ");
  const isLong = definition.split(" ").length > 12;

  return (
    <span className="relative inline-group">
      <span
        className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300 cursor-pointer text-blue-700 rounded-lg hover:shadow-md hover:border-blue-400 transition-all duration-200 font-medium text-sm"
        onClick={() => setIsModalOpen(true)}
        title="Kliknij, aby zobaczyć definicję"
      >
        {text}
        <BookOpen className="h-4 w-4" />
      </span>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 text-white text-xs rounded-lg p-3 max-w-xs shadow-lg border border-slate-700">
          <div className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {shortDefinition}
              {isLong && "..."}
            </p>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl max-w-lg w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="border-b border-border bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-blue-100">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-muted-foreground">Definicja</h3>
                  <h2 className="text-lg font-bold text-foreground break-words">{text}</h2>
                </div>
              </div>
              <button
                className="flex-shrink-0 p-1 hover:bg-white rounded-lg transition-colors duration-200 text-muted-foreground hover:text-foreground ml-2"
                onClick={() => setIsModalOpen(false)}
                title="Zamknij"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{definition}</p>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-muted/50 px-6 py-3 flex justify-end">
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium active:scale-95"
                onClick={() => setIsModalOpen(false)}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
