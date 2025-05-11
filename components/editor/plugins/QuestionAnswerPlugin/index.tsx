import { $wrapNodeInElement } from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  $getNodeByKey, // Added import
  $isParagraphNode, // Added import
  ParagraphNode // Added import for type assertion
} from 'lexical';
import { useEffect } from 'react';
import { $createQuestionAnswerNode } from '../../nodes/QuestionAnswerNode/QuestionAnswer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { QAType } from '../../nodes/QuestionAnswerNode/QuestionAnswerComponent';

export const INSERT_QA_COMMAND: LexicalCommand<QAType> = createCommand('INSERT_QA_COMMAND');

export default function QuestionAnswerPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<QAType>(
      INSERT_QA_COMMAND,
      (payload) => {
        editor.update(() => {
          const qaNode = $createQuestionAnswerNode(payload);
          
          // Create a paragraph to wrap the QuestionAnswerNode
          const paragraphWrapper = $createParagraphNode();
          paragraphWrapper.append(qaNode); // Put QuestionAnswerNode inside the paragraph

          // Insert the WRAPPING PARAGRAPH
          $insertNodes([paragraphWrapper]);

          // Get the newly inserted WRAPPING PARAGRAPH from the editor state
          const newlyInsertedParagraphKey = paragraphWrapper.getKey();
          const newlyInsertedParagraph = $getNodeByKey<ParagraphNode>(newlyInsertedParagraphKey);

          if (
            newlyInsertedParagraph &&
            $isParagraphNode(newlyInsertedParagraph) && // Ensure it's a ParagraphNode
            $isRootOrShadowRoot(newlyInsertedParagraph.getParentOrThrow())
          ) {
            // Ensure paragraph AFTER the wrapping paragraph
            let paragraphAfter = newlyInsertedParagraph.getNextSibling();
            if (!paragraphAfter || !$isParagraphNode(paragraphAfter)) {
              const newParagraphAfter = $createParagraphNode();
              newlyInsertedParagraph.insertAfter(newParagraphAfter);
              paragraphAfter = newParagraphAfter; 
            }

            // Ensure paragraph BEFORE the wrapping paragraph
            let paragraphBefore = newlyInsertedParagraph.getPreviousSibling();
            if (!paragraphBefore || !$isParagraphNode(paragraphBefore)) {
              const newActualParagraphBefore = $createParagraphNode();
              newlyInsertedParagraph.insertBefore(newActualParagraphBefore);
              paragraphBefore = newActualParagraphBefore;
            }

            // Set selection to the paragraph after the wrapping paragraph for a better UX
            if (paragraphAfter && $isParagraphNode(paragraphAfter)) {
              paragraphAfter.selectEnd();
            } else {
              newlyInsertedParagraph.selectEnd(); // Fallback
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
