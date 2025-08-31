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
import { useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ChaptersList } from "./chapters-list";
import { Module } from "@prisma/client";

const formSchema = z.object({
  titles: z.array(z.string().min(1, "Tytuł nie może być pusty")).min(1, {
    message: "Podaj przynajmniej jeden tytuł",
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
      titles: [""],
    },
  });

  const { fields, append, remove } = useFieldArray<{ titles: string[] }>({
    control: form.control,
    name: "titles",
  });
  const router = useRouter();
  const { isSubmitting, isValid } = form.formState;

  const toogleCreating = () => {
    setIsCreating((current) => !current);
  };
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const titles = values.titles.map((t) => t.trim()).filter((t) => t.length > 0);
      if (titles.length === 0) {
        toast.error("Podaj przynajmniej jeden tytuł");
        return;
      }
      await axios.post(`/api/courses/${courseId}/chapters`, { titles });
      toast.success("Moduły utworzone");
      toogleCreating();
      form.reset({ titles: [""] });
      router.refresh();
    } catch (error) {
      toast.error("Coś poszło nie tak");
    }
  };
  const onReorder = async (updateData: { id: number; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/courses/${courseId}/chapters/reorder`, {
        list: updateData,
      });
      toast.success("Zmieniono kolejność modułów");
      setIsUpdating(false);
      router.refresh();
    } catch (error) {
      setIsUpdating(false);
      toast.error("Coś poszło nie tak");
      console.error(error);
    }
  };

  const onEdit = (chapterId: number) => {
    router.push(`/teacher/courses/${courseId}/chapters/${chapterId}`);
  };

  function onDelete(chapterId: number): void {
    console.log("Deleting chapter:", `/api/courses/${courseId}/chapters/${chapterId}`);
    axios
      .delete(`/api/courses/${courseId}/chapters/${chapterId}`)
      .then(() => {
        toast.success("Moduł usunięty");
        router.refresh();
      })
      .catch(() => {
        toast.error("Coś poszło nie tak");
      });
  }

  return (
    <div className="relative mt-6 b10order bg-orange-100 rounded-md p-4">
      {isUpdating && (
        <div
          className="absolute h-full w-full bg-slate-500/200
                    top-0 right-0 flex items-center justify-center"
        >
          <Loader2 className="animate-spin h-6 w-6 text-orange-700"></Loader2>
        </div>
      )}
      <div className="font-medium flex items-center justify-between">
        Lekcje
        <Button onClick={toogleCreating} variant="ghost">
          {isCreating ? (
            <>Anuluj</>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2"></PlusCircle>
              Dodaj
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
            {fields.map((field, idx) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`titles.${idx}`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 w-full">
                    <FormControl>
                      <Input
                        type="text"
                        className="flex-1"
                        placeholder={`Tytuł modułu #${idx + 1}`}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(idx)}
                      disabled={fields.length === 1 || isSubmitting}
                      className="ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex items-center gap-x-2 mt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => append("")}
                disabled={isSubmitting}
              >
                Dodaj kolejny moduł
              </Button>
              <Button disabled={!isValid || isSubmitting} type="submit">
                Dodaj wszystkie
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div>
          <div
            className={cn(
              "text-sm mt-2",
              !chapters.length && "text-slate-500 italic"
            )}
          >
            {chapters.length > 0 ? (
              <ChaptersList
                onEdit={onEdit}
                onReorder={onReorder}
                onDelete={onDelete}
                items={chapters}
              />
            ) : (
              "Brak lekcji w tym kursie"
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Przeciągnij i upuść, aby zmienić kolejność
          </p>
        </div>
      )}
    </div>
  );
};

export default ChaptersForm;
