"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormItem,
  FormField,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import LexicalEditor from "@/components/editor/LexicalEditor";
import { SerializedDocument } from "@lexical/file";
import { SaveResult } from "@/components/editor/plugins/ActionsPlugin";

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

  const handleOnSave = (serializedDocument: SerializedDocument): SaveResult => {
    console.log(serializedDocument);
    return { success: true, hash: "" };
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
