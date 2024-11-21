import { createEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";

export function convertLexicalJsonToHtml(lexicalJson: string) {
  // Create a Lexical Editor instance
  const editor = createEditor();

  // Parse the JSON into an EditorState
  const editorState = editor.parseEditorState(lexicalJson);

  let html = "";

  // Read the EditorState and convert to HTML
  editorState.read(() => {
    html = $generateHtmlFromNodes(editor, null); // Generate HTML from nodes
  });

  return html;
}