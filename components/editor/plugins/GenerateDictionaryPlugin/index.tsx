import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $getRoot, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, createCommand, LexicalCommand } from "lexical";
import { useCallback, useEffect } from "react";
import { Dictionary, DictionaryNode } from "../../nodes/DictionaryNode";
import { DescriptionNode } from "../../nodes/DictionaryNode/DescriptionNode";

export const GENERATE_DICTIONARY_COMMAND: LexicalCommand<string> = createCommand(
  'GENERATE_DICTIONARY_COMMAND'
);

export function GenerateDictionaryPlugin() {
    const [editor] = useLexicalComposerContext();
    editor.registerEditableListener((isEditable) => {
      editor._nodes.forEach((node) => {
          if (node instanceof DictionaryNode) {
              node.isEditable = isEditable;
          }
      });
  
});
    editor.registerNodeTransform(DictionaryNode, dictionaryNode => {
        dictionaryNode.isEditable = editor.isEditable();
    });
    const generateDictionary = useCallback(() => {
      const dictionaryData: Dictionary = {};
  
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
            if (node instanceof DescriptionNode) {  
              dictionaryData[node.__text] = node.__definition;
            }
        });
        selection.getTextContent().split('\n')
        .forEach((line) => {
            const ponentialKeyValue = line.split('–');
            const key = ponentialKeyValue[0]?.trim() || '';
            const value = ponentialKeyValue[1]?.trim() || '';
            const isNotLongText = key.length < 60 && value.length < 60;
            if(ponentialKeyValue.length == 2 && isNotLongText){
              dictionaryData[key] = value;
            }
          });
        // Create your custom node
        const dictionaryNode = new DictionaryNode(dictionaryData, true);

        const root = $getRoot();
        if(root.getChildren().length == 0){
          root.append($createParagraphNode());
        }
        const paragraphNode = $createParagraphNode();
        paragraphNode.append(dictionaryNode);
        root.append(paragraphNode);
      }
      
    }, [editor]);
  
    useEffect(() => {
      return editor.registerCommand(
        GENERATE_DICTIONARY_COMMAND,
        () => {
          generateDictionary();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      );
    }, [editor, generateDictionary]);

    return null;
}