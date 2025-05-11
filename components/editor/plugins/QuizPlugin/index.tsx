import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  $getNodeByKey, 
  $isParagraphNode, 
  NodeKey, 
  ParagraphNode // Added for type assertion
} from 'lexical';
import { useEffect } from 'react';

import { QuizNode } from '../../nodes/QuizNode/QuizNode';

export const INSERT_TEST_COMMAND: LexicalCommand<{
  question: string;
  answers: string[];
  correctAnswerIndex: number;
  correctAnswerDescription: string | null;
}> = createCommand('INSERT_TEST_COMMAND');

export default function TestPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand<any>(
      INSERT_TEST_COMMAND,
      ({
        question,
        answers,
        correctAnswerIndex,
        correctAnswerDescription,
      }) => {
        editor.update(() => {
          const testNode = new QuizNode( // This is the QuizNode itself
            question,
            answers,
            correctAnswerIndex,
            correctAnswerDescription,
          );

          // Create a paragraph to wrap the QuizNode
          const paragraphWrapper = $createParagraphNode();
          paragraphWrapper.append(testNode); // Put QuizNode inside the paragraph

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
              // Fallback if paragraphAfter isn't suitable, select the end of the wrapper.
              // This might mean typing inside the wrapper after the QuizNode,
              // depending on QuizNode's rendering.
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
