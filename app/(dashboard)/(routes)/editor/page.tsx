"use client";

import PlaygroundApp from "@/components/editor/LexicalEditor";
import { SerializedDocument } from "@lexical/file";
import {hashDocument} from "@/services/HashedService";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";


export default function EditorPage() {
  //youtube & image plugin
  //https://codesandbox.io/p/sandbox/lexical-youtube-plugin-example-5unxt3?file=%2Fsrc%2Fplugins%2FYouTubePlugin.ts
  //https://codesandbox.io/p/sandbox/lexical-image-plugin-example-iy2bc5?file=%2Fsrc%2FApp.js

  //other plugins https://codesandbox.io/examples/package/lexical
  //this is interesting https://playground.lexical.dev/

  return (
    <div className="p-6">
      zaznaczanie tekstu i wybieranie z niego slowek lub definicji. udostepnianie arkusza. ew fiszki
      pozniej zadanie z tlumaczeniem (otwarte). quizy + generator, odtwarzacz audio i wideo
      odpowiedzi na pytania i pytania do teksty itd
      <PlaygroundApp onSave={function (serializedDocument: SerializedDocument): SaveResult {

        const serializedDocumentJSON = JSON.stringify(serializedDocument);
        console.log(serializedDocumentJSON);

        const hash = hashDocument(serializedDocumentJSON);
        console.log(hash);
        return { success: true, hash: hash };
      }} onEditorChange={function (editorState: string): void {
        
      }} initialStateJSON={null} isEditable={true}></PlaygroundApp>
    </div>
  );
}
