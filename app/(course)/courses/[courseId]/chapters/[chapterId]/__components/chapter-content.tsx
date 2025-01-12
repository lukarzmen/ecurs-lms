"use client";

import LexicalEditor from "@/components/editor/LexicalEditor";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
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

              }} onSave={(serializedDocument) => {
                const saveResult: SaveResult = {
                  success: true,
                  hash: ''
                };
                return saveResult;
              }}/>
              {/* <ReadOnlyEditor content={content} /> */}
        </div>
    );
}