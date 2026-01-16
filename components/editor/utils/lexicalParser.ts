import {createEditor} from 'lexical';
import {$generateHtmlFromNodes} from '@lexical/html';

import EditorNodes from '../nodes/EditorNodes';
import {migrateLexicalStateJSON} from './migrateLexicalState';

export function convertLexicalJsonToHtml(lexicalJson: string) {
  // Create a Lexical Editor instance
  const editor = createEditor({
    nodes: [...EditorNodes],
  });

  // Parse the JSON into an EditorState
  const migrated = migrateLexicalStateJSON(lexicalJson);
  const editorState = editor.parseEditorState(migrated);

  let html = "";

  // Read the EditorState and convert to HTML
  editorState.read(() => {
    html = $generateHtmlFromNodes(editor, null); // Generate HTML from nodes
  });
  return html;
}