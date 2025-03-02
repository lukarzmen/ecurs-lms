"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import LexicalEditor from "@/components/editor/LexicalEditor";
import { SerializedDocument } from "@lexical/file";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";

interface ChapterDescriptionFormProps {
  moduleContentId: string;
  courseId: string;
  chapterId: string;
}
export const ChapterDescriptionForm = ({
  moduleContentId,
  courseId,
  chapterId,
}: ChapterDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);

  useEffect(() => {
      const fetchData = async () => {
          const response = await fetch(`/api/editor/${moduleContentId}`, {
              method: 'GET'
          });

          if (!response.ok) {
              throw new Error('Error fetching initial state');
          }
          if(response){
            const text = await response.text();
            if (text) {
              const serializedEditorState: SerializedDocument = JSON.parse(text);
              setSerializedEditorStateString(JSON.stringify(serializedEditorState.editorState));
            }
          }
      };

      fetchData();
  }, []);

  const router = useRouter();

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
    
      toast.success("Chapter updated");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnSave = (serializedDocument: SerializedDocument): SaveResult => {
    console.log(serializedDocument);
    return { success: true, hash: "" };
  };

  return (
    <div className="mt-6 border bg-indigo-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Content
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? <>Cancel</> : <>
            <Pencil className="h-4 w-4 mr-2"></Pencil>
            Edit
          </>}
        </Button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 mt-4">
        <div>
          <LexicalEditor
            initialStateJSON={serializedEditorStateString}
            onSave={handleOnSave}
            isEditable={isEditing}
            onEditorChange={(content: string) => {
              setSerializedEditorStateString(content);
            }}
          />
        </div>
        {isEditing && (
          <Button type="submit" disabled={isSubmitting}>
            Save
          </Button>
        )}
      </form>
    </div>
  );
};

export default ChapterDescriptionForm;
