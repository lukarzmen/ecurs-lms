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
import { FormCard, FormActions } from "@/components/ui/form-card";
import { z } from "zod";
import { Pencil, BookOpen } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Nazwa jest wymagana",
  }),
});

interface TitleFormProps {
  title: string;
  courseId: string;
}
export const TitleForm = ({ title, courseId }: TitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: title,
    },
  });
  const router = useRouter();
  const { isSubmitting, isValid } = form.formState;
  const toogleEdit = () => {
    setIsEditing((current) => !current);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Zaktualizowano kurs");
      toogleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Coś poszło nie tak");
    }
  };

  return (
    <div className="mt-6">
      <FormCard
        title="Nazwa kursu"
        icon={BookOpen}
        status={{
          label: isEditing ? "Edycja" : "Zapisano",
          variant: isEditing ? "secondary" : "outline"
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Tytuł kursu</span>
          <Button onClick={toogleEdit} variant="ghost" size="sm">
            {isEditing ? (
              <>Anuluj</>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2"></Pencil>
                Edytuj
              </>
            )}
          </Button>
        </div>
        {isEditing ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="e.g. 'Advanced web development'"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormActions>
                <Button disabled={!isValid || isSubmitting} type="submit" className="flex-1">
                  Zapisz
                </Button>
              </FormActions>
            </form>
          </Form>
        ) : (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm font-medium">{title}</p>
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default TitleForm;
