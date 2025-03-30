
"use client"

import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { SerializedDocument } from "@lexical/file";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import LexicalEditor from "@/components/editor/LexicalEditor";
import { set } from "zod";

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
  const [isLoading, setIsLoading] = useState(false);
  const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      fetch(`/api/editor/${moduleContentId}`, {
        method: 'GET'
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Błąd pobierania dokumentu edytora');
          }
          return response.json();
        })
        .then((serializedEditorState: SerializedDocument) => {
          setSerializedEditorStateString(JSON.stringify(serializedEditorState.editorState));
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error:', error);
          setIsLoading(false);
        });
    };

    fetchData();
  }, [moduleContentId]);

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };


  const handleOnSave = (serializedDocument: SerializedDocument): SaveResult => {
    setIsLoading(true);
    try {
      const response = fetch(`/api/editor/${moduleContentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serializedDocument),
      }).then((res) => {

        if (!res.ok) {
          toast.error("Błąd zapisu dokumentu");
        }
        toast.success("Zapisano dokument");
      
      });
      

      return { success: true, hash: moduleContentId };
    } catch (error) {
      console.error('Error:', error);
      toast.error("Coś poszło nie tak podczas zapisywania dokumentu");
      return { success: false, hash: moduleContentId };
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };
  return (
    <div className="mt-6 border bg-orange-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Treść
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? <>Anuluj</> : <>
            <Pencil className="h-4 w-4 mr-2"></Pencil>
            Edytuj
          </>}
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center">
          Ładowanie...
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <div>

            <LexicalEditor
              initialStateJSON={serializedEditorStateString}
              onSave={handleOnSave}
              isEditable={isEditing}
              onEditorChange={(content: string) => {
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterDescriptionForm;
