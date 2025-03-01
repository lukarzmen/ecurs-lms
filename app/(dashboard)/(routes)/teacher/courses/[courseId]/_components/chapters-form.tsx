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
import { Loader2, Pencil, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Chapter } from "@prisma/client";
import { ChaptersList } from "./chapters-list";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

interface ChaptersFormProps {
  chapters: Chapter[];
  courseId: string;
}
export const ChaptersForm = ({ chapters, courseId }: ChaptersFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);


  //todo: adding notes https://github.com/marisabrantley/sticky-notes-app
 //https://www.npmjs.com/package/react-quiz-component quiz

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });
  const router = useRouter();
  const { isSubmitting, isValid } = form.formState;

  const toogleCreating = () => {
    setIsCreating((current) => !current);
  };
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/chapters`, values);
      toast.success("Chapter created");
      toogleCreating();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };
  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      console.log(`courseId: ${courseId}`);
      await axios.put(`/api/courses/${courseId}/chapters/reorder`, {
        list: updateData,
      });
      toast.success("Chapters reordered");
      router.refresh();
    } catch (error) {
      setIsUpdating(false);
      toast.error("Something went wrong");
      console.error(error);
    }
  };

  const onEdit = (chapterId: string) => {
    router.push(`/teacher/courses/${courseId}/chapters/${chapterId}`);
  };

  function onDelete(chapterId: string): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="relative mt-6 border bg-indigo-100 rounded-md p-4">
      {isUpdating && (
        <div
          className="absolute h-full w-full bg-slate-500/200
                    top-0 right-0 flex items-center justify-center"
        >
          <Loader2 className="animate-spin h-6 w-6 text-sky-700"></Loader2>
        </div>
      )}
      <div className="font-medium flex items-center justify-between">
        Lessons
        <Button onClick={toogleCreating} variant="ghost">
          {isCreating ? (
            <>Cancel</>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2"></PlusCircle>
              Add
            </>
          )}
        </Button>
      </div>
      {isCreating ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. Introduction to the course"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Create
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div>
          <p
            className={cn("text-sm mt-2", !chapters && "text-slate-500 italic")}
          >
            {chapters ? (
              <ChaptersList
                onEdit={onEdit}
                onReorder={onReorder}
                items={chapters || []}
              />
            ) : (
              "No chapters"
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Drag and drop to reorder lessons
          </p>
        </div>
      )}
    </div>
  );
};

export default ChaptersForm;
