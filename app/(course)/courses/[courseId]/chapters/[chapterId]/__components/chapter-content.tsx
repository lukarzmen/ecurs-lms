"use client";

import LexicalEditor from "@/components/editor/LexicalEditor";
import ReadOnlyEditor from "@/components/editor/ReadonlyEditor";
import { t } from "@excalidraw/excalidraw/types/i18n";

export default function ChapterContent ({
    content
}: {
    content: string | null;
}) {
    console.log('content', content);
    return (
        <div>
              <LexicalEditor initialStateJSON={content} isEditable={false} onEditorChange={() => {

              }} onSave={() => {
                return true;
              }}/>
              {/* <ReadOnlyEditor content={content} /> */}
        </div>
    );
}