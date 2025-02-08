import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from "lexical";
import { useEffect } from "react";
import { GapNode } from "../../nodes/GapNode";
import { SelectableAnswerNodeProps, SelectAnswerNode } from "../../nodes/SelectAnserNode";

export const INSERT_SELECT_ANSWER_NODE_COMMAND = createCommand<SelectableAnswerNodeProps>("INSERT_SELECT_ANSWER_NODE_COMMAND");

  
export default function SelectAnswerPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_SELECT_ANSWER_NODE_COMMAND,
      (payload: SelectableAnswerNodeProps) => {
        editor.update(() => {
          const selection = $getSelection();
         
            if ($isRangeSelection(selection)) {
              const root = $getRoot();
              if(root.getChildren().length == 0){
                root.append($createParagraphNode());
              }
              const selectableAnswerNode = new SelectAnswerNode(payload);
              selection.insertNodes([selectableAnswerNode]);
            }
       
          }
        );

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
