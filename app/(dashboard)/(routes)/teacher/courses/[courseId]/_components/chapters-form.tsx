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
import { ChaptersList } from "./chapters-list";
import { Module } from "@prisma/client";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

interface ModulesFormProps {
  chapters: Module[];
  courseId: string;
}
export const ChaptersForm = ({ chapters, courseId }: ModulesFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
      toast.success("Module created");
      toogleCreating();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };
  const onReorder = async (updateData: { id: number; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/courses/${courseId}/chapters/reorder`, {
        list: updateData,
      });
      toast.success("Modules reordered");
      setIsUpdating(false);
      router.refresh();
    } catch (error) {
      setIsUpdating(false);
      toast.error("Something went wrong");
      console.error(error);
    }
  };

  const onEdit = (chapterId: number) => {
    router.push(`/teacher/courses/${courseId}/chapters/${chapterId}`);
  };

  function onDelete(chapterId: number): void {
    axios
    .delete(`/api/courses/${courseId}/chapters/${chapterId}`)
      .then(() => {
        toast.success("Module deleted");
        router.refresh();
      })
      .catch(() => {
        toast.error("Something went wrong");
      });
  }

  return (
    <div className="relative mt-6 b10order bg-indigo-100 rounded-md p-4">
      {isUpdating && (
        <div
          className="absolute h-full w-full bg-slate-500/200
                    top-0 right-0 flex items-center justify-center"
        >
          <Loader2 className="animate-spin h-6 w-6 text-sky-700"></Loader2>
        </div>
      )}
      <div className="font-medium flex items-center justify-between">
      Modules
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
            className={cn("text-sm mt-2", !chapters.length && "text-slate-500 italic")}
          >
            {chapters.length > 0 ? (
              <ChaptersList
                onEdit={onEdit}
                onReorder={onReorder}
                onDelete={onDelete}
                items={chapters}
              />
            ) : (
              "No chapters"
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Drag and drop to reorder modules
          </p>
        </div>
      )}
    </div>
  );
};

export default ChaptersForm;
