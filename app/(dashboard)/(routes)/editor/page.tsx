"use client";

import PlaygroundApp from "@/components/editor/App";


export default function EditorPage() {
  //youtube & image plugin
  //https://codesandbox.io/p/sandbox/lexical-youtube-plugin-example-5unxt3?file=%2Fsrc%2Fplugins%2FYouTubePlugin.ts
  //https://codesandbox.io/p/sandbox/lexical-image-plugin-example-iy2bc5?file=%2Fsrc%2FApp.js

  //other plugins https://codesandbox.io/examples/package/lexical
  //this is interesting https://playground.lexical.dev/

  return (
    <div className="p-6">
      <PlaygroundApp></PlaygroundApp>
    </div>
  );
}
