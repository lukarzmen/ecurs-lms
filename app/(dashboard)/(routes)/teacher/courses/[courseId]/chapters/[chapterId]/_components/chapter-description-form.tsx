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

  const [lessonContent, setLessonContent] = useState(description);
  useEffect(() => {
    const content = convertLexicalJsonToHtml(description);
    setLessonContent(content);
    console.log(content);
  }, [lessonContent]);

  const router = useRouter();
  const { isSubmitting, isValid } = form.formState;
  const toogleEdit = () => {
    setIsEditing((current) => !current);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
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
      {isEditing ? (
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
                    <LexicalEditor initialValue={description} disabled={isSubmitting} onSave={handleOnSave} onEditorChange={(editorState) => {
                      form.setValue('description', editorState);
                      const content = convertLexicalJsonToHtml(description);
                      setLessonContent(content);
                    }}  {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div
          className={cn(
            "text-sm mt-2",
            !lessonContent && "text-slate-500 italic",
          )}
        >
          {lessonContent && <div
            className={cn(!lessonContent && "text-sm mt-2")}
          dangerouslySetInnerHTML={{ __html: lessonContent || "No description" }}
        />}
          {!lessonContent && "No description"}
        </div>
      )}
    </div>
  );
};

export default ChapterDescriptionForm;
