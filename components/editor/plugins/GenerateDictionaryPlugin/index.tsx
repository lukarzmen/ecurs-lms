import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createTabNode, $createTextNode, $getRoot, $getSelection, $insertNodes, $isNodeSelection, $isRangeSelection, $isRootOrShadowRoot, $nodesOfType, COMMAND_PRIORITY_EDITOR, COMMAND_PRIORITY_LOW, createCommand, LexicalCommand, LexicalNode } from "lexical";
import { useCallback, useEffect, useState } from "react";
import { DictionaryKeywordNode } from "../../nodes/DictionaryKeywordNode";
import { $wrapNodeInElement } from "@lexical/utils";
import { $createStickyNode } from "../../nodes/StickyNode";
import { Dictionary, DictionaryNode } from "../../nodes/DictionaryNode";

export const GENERATE_DICTIONARY_COMMAND: LexicalCommand<string> = createCommand(
  'GENERATE_DICTIONARY_COMMAND'
);

export function GenerateDictionaryPlugin() {
    const [editor] = useLexicalComposerContext();

    const generateDictionary = useCallback(() => {
      const dictionaryData: Dictionary = {};
  
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
            if (node instanceof DictionaryKeywordNode) {  
              dictionaryData[node.__text] = '';
            }
        });
        
        const focusNode = selection.focus.getNode();
        const focusKey = selection.focus.key;
        // Determine the node immediately after the focus node
        const nextSibling = focusNode.getNextSibling();

        // Create your custom node
        const dictionaryNode = new DictionaryNode(dictionaryData);

        if (nextSibling) {
          // Insert the dictionary node after the next sibling
          nextSibling.insertAfter(dictionaryNode);
        } else {
          // If there's no next sibling, insert after the focus node
          focusNode.insertAfter(dictionaryNode);
        }

        // Optionally, move the selection to the end of the inserted node
        dictionaryNode.selectEnd();
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