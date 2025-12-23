import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { 
  $createParagraphNode, 
  $getRoot, 
  $getSelection, 
  $isRangeSelection, 
  COMMAND_PRIORITY_LOW, 
  createCommand, 
  LexicalCommand, 
  $insertNodes, 
  LexicalNode, 
  ElementNode,
  $getNodeByKey, // Added import
  $isParagraphNode, // Added import
  ParagraphNode // Added import for type assertion
} from "lexical";
import { useCallback, useEffect } from "react";
import { Dictionary, DictionaryNode } from "../../nodes/DictionaryNode";
import { DescriptionNode } from "../../nodes/DictionaryNode/DescriptionNode";

export const GENERATE_DICTIONARY_COMMAND: LexicalCommand<string> = createCommand(
  'GENERATE_DICTIONARY_COMMAND'
);

export function GenerateDictionaryPlugin() {
    const [editor] = useLexicalComposerContext();
    
    useEffect(() => {
      if (!editor.hasNodes([DictionaryNode, DescriptionNode])) {
        throw new Error('GenerateDictionaryPlugin: DictionaryNode or DescriptionNode not registered on editor');
      }
    }, [editor]);

    editor.registerEditableListener((isEditable) => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        root.getChildren().forEach(node => {
          if (node instanceof DictionaryNode) {
            // Ensure we get the latest version of the node
            const latestNode = editor.getElementByKey(node.getKey());
            if (latestNode instanceof DictionaryNode) {
              latestNode.isEditable = isEditable;
            }
          }
        });
      });
    });

    editor.registerNodeTransform(DictionaryNode, dictionaryNode => {
        if (dictionaryNode.__key) {  // First check if key exists
            const latestNode = $getNodeByKey(dictionaryNode.__key);
            if (latestNode instanceof DictionaryNode) {
              latestNode.isEditable = editor.isEditable();
            }
        }
    });

    const generateDictionary = useCallback(() => {
      editor.update(() => {
        const dictionaryData: Dictionary = {};
        const selection = $getSelection();
    
        if ($isRangeSelection(selection)) {
          const nodes = selection.getNodes();
          nodes.forEach((node) => {
              if (node instanceof DescriptionNode) {  
                dictionaryData[node.getTextContent()] = node.__definition;
              } else if (node instanceof ElementNode) { 
                const collectDescendants = (element: ElementNode): LexicalNode[] => {
                  const children = element.getChildren();
                  return children.reduce<LexicalNode[]>((acc, child) => {
                    if (child instanceof ElementNode) {
                      return acc.concat(child, collectDescendants(child));
                    }
                    return acc.concat(child);
                  }, []);
                };

                const descendants = collectDescendants(node);
                descendants.forEach((descendant: LexicalNode) => {
                  if (descendant instanceof DescriptionNode) {
                    dictionaryData[descendant.getTextContent()] = descendant.__definition;
                  }
                });
              }
          });
          
          if (Object.keys(dictionaryData).length === 0) {
            selection.getTextContent().split('\n')
            .forEach((line) => {
                // Accept separators: hyphen (-), en dash (–), em dash (—) with spacing to avoid splitting compound words
                const dashMatch = line.match(/^\s*(.+?)\s*[–—-]\s+(.*)$/);
                const key = dashMatch?.[1]?.trim() || '';
                const value = dashMatch?.[2]?.trim() || '';
                const isNotLongText = key.length < 60 && value.length < 60;
                if(dashMatch && key && value && isNotLongText){
                  dictionaryData[key] = value;
                }
              });
          }
        }
    
        const dictionaryNode = new DictionaryNode(dictionaryData, editor.isEditable());
        const paragraphToInsert = $createParagraphNode();
        paragraphToInsert.append(dictionaryNode);

        const paragraphToInsertKey = paragraphToInsert.getKey();

        if ($isRangeSelection(selection)) {
          selection.insertNodes([paragraphToInsert]);
        } else {
          const root = $getRoot();
          root.append(paragraphToInsert);
        }
    
        const actualInsertedParagraph = $getNodeByKey<ParagraphNode>(paragraphToInsertKey);

        if (actualInsertedParagraph && $isParagraphNode(actualInsertedParagraph)) {
          // Ensure paragraph AFTER the inserted paragraph
          let paragraphForCursor = actualInsertedParagraph.getNextSibling();
          if (!paragraphForCursor || !$isParagraphNode(paragraphForCursor)) {
            const newParagraphAfter = $createParagraphNode();
            actualInsertedParagraph.insertAfter(newParagraphAfter);
            paragraphForCursor = newParagraphAfter;
          }

          // Ensure paragraph BEFORE the inserted paragraph
          const paragraphBefore = actualInsertedParagraph.getPreviousSibling();
          if (!paragraphBefore || !$isParagraphNode(paragraphBefore)) {
            const newParagraphBefore = $createParagraphNode();
            actualInsertedParagraph.insertBefore(newParagraphBefore);
          }

          // Set selection to the paragraph after for better UX
          if (paragraphForCursor && $isParagraphNode(paragraphForCursor)) {
            paragraphForCursor.selectEnd();
          } else {
            actualInsertedParagraph.selectEnd(); // Fallback
          }
        } else {
          console.error("GenerateDictionaryPlugin: Failed to retrieve or validate the inserted paragraph node.");
          // Fallback selection if node retrieval failed
          const root = $getRoot();
          const lastDescendant = root.getLastDescendant();
          if (lastDescendant && typeof lastDescendant.selectEnd === 'function') {
            lastDescendant.selectEnd();
          } else {
            editor.focus()
          }
        }
      });
      
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