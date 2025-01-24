import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from "lexical";
import { useEffect } from "react";
import { GapNode } from "../../nodes/GapNode";
import { AudioNode } from "../../nodes/AudioNode";

export const CREATE_AUDIO_NODE_COMMAND: LexicalCommand<string>  = createCommand("CREATE_AUDIO_NODE_COMMAND");

export default function AudioPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
        CREATE_AUDIO_NODE_COMMAND,
    (audioSrc: string) => {
      editor.update(() => {
        const audioNode = new AudioNode(audioSrc);

        const root = $getRoot();
        const paragraphNode = $createParagraphNode();
        paragraphNode.append(audioNode);
        root.append(paragraphNode);
      });
      return true;
    },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
