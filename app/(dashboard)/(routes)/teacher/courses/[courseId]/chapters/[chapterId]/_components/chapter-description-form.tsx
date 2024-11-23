"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Editor } from "@/components/editor";
import { Preview } from "@/components/preview";
import LexicalEditor from "@/components/editor/LexicalEditor";
import { SerializedDocument } from "@lexical/file";
import { convertLexicalJsonToHtml } from "@/components/editor/utils/lexicalParser";
import { EditorState } from "lexical";
import ReadOnlyEditor from "@/components/editor/ReadonlyEditor";

const formSchema = z.object({
  description: z.string().min(1),
});

interface ChapterDescriptionFormProps {
  description: string;
  courseId: string;
  chapterId: string;
}
export const ChapterDescriptionForm = ({
  description,
  courseId,
  chapterId,
}: ChapterDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: description,
    },
  });
  
  useEffect(() => {

    console.log('description', description);  
  }, [isEditing]);

  const router = useRouter();
  const { isSubmitting, isValid } = form.formState;
  const toogleEdit = () => {
    setIsEditing((current) => !current);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log(values);
      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}`,
        values,
      );
      toast.success("Chapter updated");
      toogleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleOnSave = (serializedDocument: SerializedDocument) => {
    console.log(serializedDocument);
    return true;
  }

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Content
        <Button onClick={toogleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2"></Pencil>
              Edit
            </>
          )}
        </Button>
      </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LexicalEditor initialStateJSON={description} disabled={isSubmitting} onSave={handleOnSave} 
                    isEditable={isEditing}
                    onEditorChange={(content: string) => {
                      form.setValue('description', content);
                    }}  {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
          </form>
        </Form>
     
    </div>
  );
};

export default ChapterDescriptionForm;
