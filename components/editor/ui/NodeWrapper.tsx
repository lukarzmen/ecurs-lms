import { $getNodeByKey, LexicalEditor, NodeKey } from 'lexical';
import { Trash2 } from 'lucide-react';
import React from 'react';

interface NodeWrapperProps {
  editor: LexicalEditor;
  nodeKey: NodeKey;
  children: React.ReactNode;
}

/**
 * Wraps a custom Lexical DecoratorNode component with a delete button
 * that appears on hover (edit mode only).
 */
export function NodeWrapper({ editor, nodeKey, children }: NodeWrapperProps): JSX.Element {
  if (!editor.isEditable()) {
    return <>{children}</>;
  }

  const handleDelete = (e: React.MouseEvent) => {
    // Prevent Lexical from losing focus/selection when button is clicked
    e.preventDefault();
    e.stopPropagation();
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      node?.remove();
    });
  };

  return (
    <div className="group/nodeblock relative">
      <button
        type="button"
        onMouseDown={handleDelete}
        className="absolute right-2 top-2 z-20 hidden h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background/90 text-muted-foreground shadow-sm transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive group-hover/nodeblock:flex"
        title="Usuń element"
        aria-label="Usuń element"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {children}
    </div>
  );
}
