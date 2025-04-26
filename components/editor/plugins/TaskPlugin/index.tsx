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
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createDoTaskNode } from '../../nodes/DoTaskNode/DoTask';

export type DoTaskType = {
  task: string;
  hint: string | null;
};

export const INSERT_TASK_COMMAND: LexicalCommand<DoTaskType> = createCommand('INSERT_TASK_COMMAND');

export default function QuestionAnswerPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<DoTaskType>(
      INSERT_TASK_COMMAND,
      (payload) => {
        const doTaskNode = $createDoTaskNode(payload);
        editor.update(() => {
          $insertNodes([doTaskNode]);
          if ($isRootOrShadowRoot(doTaskNode.getParentOrThrow())) {
            $wrapNodeInElement(doTaskNode, $createParagraphNode).selectEnd();
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
