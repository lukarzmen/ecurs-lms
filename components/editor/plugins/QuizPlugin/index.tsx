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
  ParagraphNode
} from 'lexical';
import { useEffect } from 'react';

import { QuizNode } from '../../nodes/QuizNode/QuizNode';
import { Test } from '../../nodes/QuizNode/QuizComponent';

// Update command to accept an array of tests
export const INSERT_TEST_COMMAND: LexicalCommand<{
  tests: Test[];
}> = createCommand('INSERT_TEST_COMMAND');

export default function QuizPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand<any>(
      INSERT_TEST_COMMAND,
      ({ tests }) => {
        editor.update(() => {
          const quizNode = new QuizNode(tests);

          const paragraphWrapper = $createParagraphNode();
          paragraphWrapper.append(quizNode);

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
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);
  return null;
}
