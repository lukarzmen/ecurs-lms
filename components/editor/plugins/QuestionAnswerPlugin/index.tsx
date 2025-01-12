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
        const qaNode = $createQuestionAnswerNode(payload);
        editor.update(() => {
          $insertNodes([qaNode]);
          if ($isRootOrShadowRoot(qaNode.getParentOrThrow())) {
            $wrapNodeInElement(qaNode, $createParagraphNode).selectEnd();
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
