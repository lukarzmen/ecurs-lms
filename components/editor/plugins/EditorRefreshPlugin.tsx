import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $createParagraphNode, $getRoot, $createTextNode } from 'lexical';

interface EditorRefreshPluginProps {
  initialStateJSON: string | null;
}

export default function EditorRefreshPlugin({ initialStateJSON }: EditorRefreshPluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialStateJSON) {
      try {
        const parsedState = editor.parseEditorState(initialStateJSON);
        editor.update(() => {
          editor.setEditorState(parsedState);
        });
      } catch (error) {
        console.error('Error parsing editor state:', error);
        // If parsing fails, clear the editor
        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });
      }
    } else {
      // If no initial state, clear the editor
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(''));
        root.append(paragraph);
      });
    }
  }, [editor, initialStateJSON]);

  return null;
}