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
import { FormCard, FormActions, FormSection } from "@/components/ui/form-card";
import { z } from "zod";
import { Loader2, Pencil, PlusCircle, X, Wand2, BookOpen } from "lucide-react";
import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ChaptersList } from "./chapters-list";
import { Module } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  titles: z.array(z.string().min(1, "Tytuł nie może być pusty")).min(1, {
    message: "Podaj przynajmniej jeden tytuł",
  }),
});

interface ModulesFormProps {
  chapters: Module[];
  courseId: string;
  courseTitle?: string;
}
export const ChaptersForm = ({ chapters, courseId, courseTitle }: ModulesFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [editableCourseTitle, setEditableCourseTitle] = useState(courseTitle || "");
  const { t } = useI18n();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titles: [""],
    },
  });

  // Note: useFieldArray types prefer arrays of objects; we're using an array of primitives (string[]),
  // so relax generics to avoid "string is not assignable to never" TS error.
  const { fields, append, remove } = useFieldArray<any, "titles">({
    control: form.control,
    name: "titles",
  });
  const router = useRouter();
  const { isSubmitting, isValid } = form.formState;

  const toogleCreating = () => {
    setIsCreating((current) => !current);
  };

  const handleOpenAIModal = () => {
    const defaultPrompt = editableCourseTitle ? `Stwórz treść kursu ${editableCourseTitle}` : "Stwórz treść kursu";
    setAiPrompt(defaultPrompt);
    setShowAIModal(true);
  };

  const generateLessonsWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error(t('chaptersForm.aiEnterPrompt'));
      return;
    }

    try {
      setIsGeneratingAI(true);
      
      // Prepare existing chapters information
      const existingChapters = chapters.map(chapter => chapter.title);
      const hasExistingChapters = existingChapters.length > 0;
      
      let systemPrompt = "Jesteś ekspertem w tworzeniu programów edukacyjnych. Generujesz tylko tytuły lekcji/modułów na podstawie opisu kursu.";
      let userPrompt = "";
      
      if (hasExistingChapters) {
        systemPrompt += " Unikaj duplikatów z już istniejącymi lekcjami.";
        userPrompt = `Na podstawie tego opisu kursu: "${aiPrompt}", wygeneruj listę 5-10 NOWYCH tytułów lekcji/modułów, które UZUPEŁNIĄ już istniejące lekcje.

ISTNIEJĄCE LEKCJE W KURSIE:
${existingChapters.map((title, index) => `${index + 1}. ${title}`).join('\n')}

Wygeneruj TYLKO NOWE, UZUPEŁNIAJĄCE lekcje. NIE powtarzaj istniejących tematów. Zwróć tylko tytuły, każdy w nowej linii, bez numeracji, bez dodatkowych opisów.`;
      } else {
        userPrompt = `Na podstawie tego opisu kursu: "${aiPrompt}", wygeneruj listę 8-15 tytułów lekcji/modułów. Zwróć tylko tytuły, każdy w nowej linii, bez numeracji, bez dodatkowych opisów. Przykład formatu:\nWprowadzenie do geografii\nZiemia jako planeta\nLitosfera i procesy geologiczne`;
      }
      
      const llmPrompt = {
        systemPrompt,
        userPrompt
      };

      const response = await axios.post('/api/tasks', llmPrompt);
      console.log('API Response:', response.data);
      const generatedText = response.data;
      
      if (!generatedText || typeof generatedText !== 'string') {
        console.error('Invalid response from API:', generatedText);
        toast.error(t('chaptersForm.aiInvalidResponse'));
        return;
      }
      
      // Parse the generated titles
      const titles = generatedText
        .split('\n')
        .map((title: string) => title.trim())
        .filter((title: string) => title.length > 0 && !title.match(/^\d+\./)) // Remove numbered items
        .slice(0, 15); // Limit to 15 titles

      if (titles.length === 0) {
        toast.error(t('chaptersForm.aiGenerationFailed'));
        return;
      }

      // Always add to existing form titles (even if chapters array is empty, there might be unsaved titles in form)
      const currentTitles = form.getValues('titles').filter(t => t.trim().length > 0);
      const allTitles = [...currentTitles, ...titles];
      form.setValue('titles', allTitles);
      
      setIsCreating(true);
      setShowAIModal(false);
      setAiPrompt("");
      
      const message = hasExistingChapters 
        ? t('chaptersForm.aiGeneratedNew').replace('{count}', String(titles.length))
        : t('chaptersForm.aiGenerated').replace('{count}', String(titles.length));
      toast.success(message);
    } catch (error) {
      console.error('Error generating lessons:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        toast.error(t('chaptersForm.apiError').replace('{error}', error.response?.data || error.message));
      } else {
        toast.error(t('chaptersForm.generationError'));
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const titles = values.titles.map((t) => t.trim()).filter((t) => t.length > 0);
      if (titles.length === 0) {
        toast.error(t('chaptersForm.atLeastOneTitle'));
        return;
      }
      await axios.post(`/api/courses/${courseId}/chapters`, { titles });
      toast.success(t('chaptersForm.modulesCreated'));
      toogleCreating();
      form.reset({ titles: [""] });
      router.refresh();
    } catch (error) {
      toast.error(t('courseForm.somethingWrong'));
    }
  };
  const onReorder = async (updateData: { id: number; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/courses/${courseId}/chapters/reorder`, {
        list: updateData,
      });
      toast.success(t('chaptersForm.reorderSuccess'));
      setIsUpdating(false);
      router.refresh();
    } catch (error) {
      setIsUpdating(false);
      toast.error(t('courseForm.somethingWrong'));
      console.error(error);
    }
  };

  const onEdit = (chapterId: number) => {
    router.push(`/teacher/courses/${courseId}/chapters/${chapterId}`);
  };

  const onEditTitle = async (chapterId: number, newTitle: string) => {
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
        title: newTitle
      });
      toast.success(t('chaptersForm.titleUpdated'));
      router.refresh();
    } catch (error) {
      console.error('Error updating chapter title:', error);
      toast.error(t('chaptersForm.titleUpdateError'));
    }
  };

  function onDelete(chapterId: number): void {
    console.log("Deleting chapter:", `/api/courses/${courseId}/chapters/${chapterId}`);
    axios
      .delete(`/api/courses/${courseId}/chapters/${chapterId}`)
      .then(() => {
        toast.success(t('chaptersForm.moduleDeleted'));
        router.refresh();
      })
      .catch(() => {
        toast.error(t('courseForm.somethingWrong'));
      });
  }

  return (
    <div className="mt-6">
      <FormCard
        title={t('chaptersForm.courseLessons')}
        icon={BookOpen}
        status={{
          label: isCreating ? t('chaptersForm.adding') : (chapters.length > 0 ? t('chaptersForm.lessonsCount').replace('{count}', String(chapters.length)) : t('chaptersForm.noLessons')),
          variant: isCreating ? "secondary" : (chapters.length > 0 ? "default" : "outline"),
          className: isCreating ? "bg-blue-500 text-white" : (chapters.length > 0 ? "bg-green-500" : "")
        }}
        isLoading={isUpdating}
        loadingMessage={t('chaptersForm.updatingOrder')}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{t('chaptersForm.manageLessons')}</span>
          <div className="flex gap-2">
          <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleOpenAIModal}
                variant="outline"
                disabled={isCreating || isUpdating}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {t('chaptersForm.generateAI')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('chaptersForm.aiDialogTitle')}</DialogTitle>
                <DialogDescription>
                  {chapters.length > 0 
                    ? t('chaptersForm.aiDialogDescExisting')
                    : t('chaptersForm.aiDialogDescNew')
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="courseTitle" className="text-sm font-medium">
                    {t('chaptersForm.courseTitle')}
                  </label>
                  <Input
                    id="courseTitle"
                    value={editableCourseTitle}
                    onChange={(e) => setEditableCourseTitle(e.target.value)}
                    placeholder={t('chaptersForm.courseTitlePlaceholder')}
                    disabled={isGeneratingAI}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="aiPrompt" className="text-sm font-medium">
                    {t('chaptersForm.courseDescription')}
                  </label>
                  <Textarea
                    id="aiPrompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={t('chaptersForm.courseDescPlaceholder')} 
                    className="min-h-[120px]"
                    disabled={isGeneratingAI}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAIModal(false)}
                  disabled={isGeneratingAI}
                >
                  {t('courseForm.cancel')}
                </Button>
                <Button
                  onClick={generateLessonsWithAI}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('chaptersForm.generating')}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      {t('chaptersForm.generateLessons')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={toogleCreating} variant="ghost" disabled={isUpdating}>
            {isCreating ? (
              <>{t('courseForm.cancel')}</>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2"></PlusCircle>
                {t('chaptersForm.add')}
              </>
            )}
          </Button>
        </div>
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
                        placeholder={t('chaptersForm.modulePlaceholder').replace('{num}', String(idx + 1))}
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
                {t('chaptersForm.addAnother')}
              </Button>
              <Button disabled={!isValid || isSubmitting} type="submit">
                {t('chaptersForm.addAll')}
              </Button>
            </div>
          </form>
        </Form>
        ) : (
          <div>
            {chapters.length > 0 ? (
              <ChaptersList
                onEdit={onEdit}
                onEditTitle={onEditTitle}
                onReorder={onReorder}
                onDelete={onDelete}
                items={chapters}
              />
            ) : (
              <FormSection variant="warning">
                <p>
                  <strong>{t('chaptersForm.noLessonsTitle')}</strong><br />
                  {t('chaptersForm.noLessonsHint')}
                </p>
              </FormSection>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              {t('chaptersForm.dragReorder')}
            </p>
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default ChaptersForm;
