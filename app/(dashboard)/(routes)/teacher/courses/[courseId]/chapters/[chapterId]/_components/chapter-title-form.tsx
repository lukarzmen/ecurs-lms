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
import { Pencil, FileText } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/use-i18n";

const formSchema = z.object({
  title: z.string().min(1),
});

interface ChapterTitleFormProps {
  title: string;
  courseId: string;
  chapterId: string;
}
export const ChapterTitleForm = ({
  title,
  courseId,
  chapterId,
}: ChapterTitleFormProps) => {
    const { t } = useI18n();
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
      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}`,
        values,
      );
      toast.success(t("chapterTitleForm.updated"));
      toogleEdit();
      router.refresh();
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="mt-6">
      <FormCard
        title={t("chapterTitleForm.title")}
        icon={FileText}
        status={{
          label: isEditing ? t("chapterTitleForm.statusEditing") : t("chapterTitleForm.statusSaved"),
          variant: isEditing ? "secondary" : "outline",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{t("chapterTitleForm.subtitle")}</span>
          <Button onClick={toogleEdit} variant="ghost" size="sm">
            {isEditing ? (
              <>{t("common.cancel")}</>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2"></Pencil>
                {t("common.edit")}
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
                        placeholder="e.g. 'Introduction to React'"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormActions>
                <Button disabled={!isValid || isSubmitting} type="submit" className="flex-1">
                  {t("common.save")}
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

export default ChapterTitleForm;
