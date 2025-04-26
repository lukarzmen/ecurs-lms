import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement } from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
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
        const testNode = new QuizNode(
          question,
          answers,
          correctAnswerIndex,
          correctAnswerDescription
        );
        $insertNodes([testNode]);
        if ($isRootOrShadowRoot(testNode.getParentOrThrow())) {
            const newParagraph = $createParagraphNode();
            testNode.insertAfter(newParagraph);
            newParagraph.selectEnd();
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}
