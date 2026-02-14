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
import { $createTrueFalseNode } from "../../nodes/TrueFalseNode/TrueFalseNode";
import { TrueFalseQuestion } from "../../nodes/TrueFalseNode/TrueFalseComponent";

export const INSERT_TRUE_FALSE_COMMAND: LexicalCommand<{ questions: TrueFalseQuestion[] }> =
  createCommand("INSERT_TRUE_FALSE_COMMAND");

export default function TrueFalsePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_TRUE_FALSE_COMMAND,
      ({ questions }) => {
        editor.update(() => {
          const node = $createTrueFalseNode(questions);

          const paragraphWrapper = $createParagraphNode();
          paragraphWrapper.append(node);

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
