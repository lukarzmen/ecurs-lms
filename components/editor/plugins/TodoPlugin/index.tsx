import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  $getNodeByKey,
  $isParagraphNode,
  ParagraphNode
} from "lexical";
import { $createTodoNode } from "../../nodes/TodoNode/TodoNode";
import { TodoItem } from "../../nodes/TodoNode/TodoComponent";

export const INSERT_TODO_COMMAND: LexicalCommand<{ title: string; items: TodoItem[] }> = createCommand("INSERT_TODO_COMMAND");

export function TodoPlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return editor.registerCommand<any>(
      INSERT_TODO_COMMAND,
      ({ title, items }) => {
        editor.update(() => {
          const todoNode = $createTodoNode(title, items);
            const paragraphWrapper = $createParagraphNode();
          paragraphWrapper.append(todoNode);

          $insertNodes([paragraphWrapper]);

          const newlyInsertedParagraphKey = paragraphWrapper.getKey();
          const newlyInsertedParagraph = $getNodeByKey<ParagraphNode>(newlyInsertedParagraphKey);

          if (
            newlyInsertedParagraph &&
            $isParagraphNode(newlyInsertedParagraph) &&
            $isRootOrShadowRoot(newlyInsertedParagraph.getParentOrThrow())
          ) {
            let paragraphAfter = newlyInsertedParagraph.getNextSibling();
            if (!paragraphAfter || !$isParagraphNode(paragraphAfter)) {
              const newParagraphAfter = $createParagraphNode();
              newlyInsertedParagraph.insertAfter(newParagraphAfter);
              paragraphAfter = newParagraphAfter; 
            }

            let paragraphBefore = newlyInsertedParagraph.getPreviousSibling();
            if (!paragraphBefore || !$isParagraphNode(paragraphBefore)) {
              const newActualParagraphBefore = $createParagraphNode();
              newlyInsertedParagraph.insertBefore(newActualParagraphBefore);
              paragraphBefore = newActualParagraphBefore; 
            }

            if (paragraphAfter && $isParagraphNode(paragraphAfter)) {
              paragraphAfter.selectEnd();
            } else {
              newlyInsertedParagraph.selectEnd();
            }
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
