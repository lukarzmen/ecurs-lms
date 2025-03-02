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
import toast from "react-hot-toast";

export const INSERT_GAP_NODE_COMMAND = createCommand("INSERT_GAP_NODE_COMMAND");

export default function InsertGapNodePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_GAP_NODE_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();

          // Ensure we have a valid range selection
          if ($isRangeSelection(selection)) {
            const selectedText = selection.getTextContent();

            if (selectedText.trim() === "") {
              toast.error("To change selected to gap please select text first.");
              return false; // Early exit if no text is selected
            }

            // Use the selected text as `text` and `hiddenText`
            const hiddenText = selectedText.trim(); // Store actual text as hidden

            // Create the GapNode
            const gapNode = new GapNode(hiddenText);

            // Insert GapNode into the editor
            selection.insertNodes([gapNode]);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
