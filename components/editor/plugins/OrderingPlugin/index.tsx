import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getNodeByKey,
  $insertNodes,
  $isParagraphNode,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  ParagraphNode,
} from "lexical";
import { useEffect } from "react";
import { $createOrderingNode } from "../../nodes/OrderingNode/OrderingNode";
import { OrderingItem } from "../../nodes/OrderingNode/OrderingComponent";

export const INSERT_ORDERING_COMMAND: LexicalCommand<{ items: OrderingItem[] }> =
  createCommand("INSERT_ORDERING_COMMAND");

export default function OrderingPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_ORDERING_COMMAND,
      ({ items }) => {
        editor.update(() => {
          const orderingNode = $createOrderingNode(items);

          const paragraphWrapper = $createParagraphNode();
          paragraphWrapper.append(orderingNode);

          $insertNodes([paragraphWrapper]);

          const newlyInsertedParagraphKey = paragraphWrapper.getKey();
          const newlyInsertedParagraph = $getNodeByKey<ParagraphNode>(
            newlyInsertedParagraphKey,
          );

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
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
