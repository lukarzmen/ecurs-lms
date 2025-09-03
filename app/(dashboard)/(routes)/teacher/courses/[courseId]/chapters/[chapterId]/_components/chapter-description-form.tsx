"use client"

import { Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { SerializedDocument } from "@lexical/file";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";
import LexicalEditor from "@/components/editor/LexicalEditor";

interface ChapterDescriptionFormProps {
  courseId: string;
  chapterId: string;
}

export const ChapterDescriptionForm = ({
  chapterId: moduleId,
}: ChapterDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serializedEditorStateString, setSerializedEditorStateString] = useState<string | null>(null);

  // Extract fetch logic to a function
  const [notFound, setNotFound] = useState(false);
  const fetchData = useCallback(() => {
    setIsLoading(true);
    setNotFound(false);
    fetch(`/api/content/${moduleId}`, {
      method: 'GET'
    })
      .then(response => {
        if (response.status === 404) {
          setNotFound(true);
          setSerializedEditorStateString(null);
          setIsLoading(false);
          return null;
        }
        if (!response.ok) {
          throw new Error('Błąd pobierania dokumentu edytora');
        }
        return response.json();
      })
      .then((serializedEditorState: string | null) => {
        if (!serializedEditorState) return;
        const data: SerializedDocument = JSON.parse(serializedEditorState);
        if (data.editorState.root.children.length === 0) {
          setSerializedEditorStateString(null);
          setIsLoading(false);
          return;
        }
        setSerializedEditorStateString(JSON.stringify(data.editorState));
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setIsLoading(false);
      });
  }, [moduleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleEdit = () => {
    if (isEditing) {
      // If cancelling, reload the initial state
      fetchData();
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleOnSave = (serializedDocument: SerializedDocument): SaveResult => {
    setIsLoading(true);
    try {
      fetch(`/api/content/${moduleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serializedDocument),
      }).then((res) => {
        if (!res.ok) {
          toast.error("Błąd zapisu dokumentu");
          setIsLoading(false);
          return;
        }
        toast.success("Zapisano dokument");
        // Fetch new content after save
        fetchData();
        setIsEditing(false);
      });

      return { success: true };
    } catch (error) {
      console.error('Error:', error);
      toast.error("Coś poszło nie tak podczas zapisywania dokumentu");
      setIsLoading(false);
      return { success: false };
    }
  };

  return (
    <div className="mt-6 border bg-orange-100 rounded-md p-4 overflow-hidden">
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
          <Loader2 className="animate-spin text-orange-700" size={32} />
        </div>
      ) : notFound && !isEditing ? (
        <div className="space-y-4 mt-4 text-center text-orange-700 font-semibold">
          Treść nie istnieje. Edytuj aby utworzyć treść lekcji.
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <div>
            <LexicalEditor
              initialStateJSON={notFound ? null : serializedEditorStateString}
              onSave={handleOnSave}
              isEditable={isEditing}
              onEditorChange={() => {
              }}
              onCompleted={() => {
              }}
              isCompleted={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterDescriptionForm;
