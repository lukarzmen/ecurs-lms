"use client";

import PlaygroundApp from "@/components/editor/LexicalEditor";
import { SerializedDocument } from "@lexical/file";
import {hashDocument} from "@/services/HashedService";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { useAuth } from "@clerk/nextjs";


export default function EditorPage() {
  const { userId } = useAuth();
  
  if(!userId) {
    return redirect(`/sign-in?redirectUrl=/editor`);
  }
  //youtube & image plugin
  //https://codesandbox.io/p/sandbox/lexical-youtube-plugin-example-5unxt3?file=%2Fsrc%2Fplugins%2FYouTubePlugin.ts
  //https://codesandbox.io/p/sandbox/lexical-image-plugin-example-iy2bc5?file=%2Fsrc%2FApp.js

  //other plugins https://codesandbox.io/examples/package/lexical
  //this is interesting https://playground.lexical.dev/

  return (
    <div className="p-4">
      <PlaygroundApp onSave={function (serializedDocument: SerializedDocument): SaveResult {

        const serializedDocumentJSON = JSON.stringify(serializedDocument);
        console.log(serializedDocumentJSON);

        const hash = hashDocument(serializedDocumentJSON);
        fetch(`/api/editor/${hash}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serializedDocument),
        })
          .then(response => response.json())
          .then(data => {
            console.log('Success:', data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
        console.log(hash);
        return { success: true, hash: hash };
      }} onEditorChange={function (): void {
        

      }} initialStateJSON={null} isEditable={true}></PlaygroundApp>
    </div>
  );
}
