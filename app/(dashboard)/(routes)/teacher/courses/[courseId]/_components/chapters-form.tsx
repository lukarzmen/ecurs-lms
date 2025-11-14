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
import { Loader2, Pencil, PlusCircle, X, Wand2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
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
    const defaultPrompt = courseTitle ? `Stwórz treść kursu ${courseTitle}` : "Stwórz treść kursu";
    setAiPrompt(defaultPrompt);
    setShowAIModal(true);
  };

  const generateLessonsWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Wprowadź opis kursu do wygenerowania lekcji");
      return;
    }

    try {
      setIsGeneratingAI(true);
      
      const llmPrompt = {
        systemPrompt: "Jesteś ekspertem w tworzeniu programów edukacyjnych. Generujesz tylko tytuły lekcji/modułów na podstawie opisu kursu.",
        userPrompt: `Na podstawie tego opisu kursu: "${aiPrompt}", wygeneruj listę 8-15 tytułów lekcji/modułów. Zwróć tylko tytuły, każdy w nowej linii, bez numeracji, bez dodatkowych opisów. Przykład formatu:\nWprowadzenie do geografii\nZiemia jako planeta\nLitosfera i procesy geologiczne`
      };

      const response = await axios.post('/api/tasks', llmPrompt);
      console.log('API Response:', response.data);
      const generatedText = response.data;
      
      if (!generatedText || typeof generatedText !== 'string') {
        console.error('Invalid response from API:', generatedText);
        toast.error("Otrzymano nieprawidłową odpowiedź z API");
        return;
      }
      
      // Parse the generated titles
      const titles = generatedText
        .split('\n')
        .map((title: string) => title.trim())
        .filter((title: string) => title.length > 0 && !title.match(/^\d+\./)) // Remove numbered items
        .slice(0, 15); // Limit to 15 titles

      if (titles.length === 0) {
        toast.error("Nie udało się wygenerować tytułów lekcji");
        return;
      }

      // Set the generated titles in the form
      form.setValue('titles', titles);
      setIsCreating(true);
      setShowAIModal(false);
      setAiPrompt("");
      
      toast.success(`Wygenerowano ${titles.length} tytułów lekcji`);
    } catch (error) {
      console.error('Error generating lessons:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        toast.error(`Błąd API: ${error.response?.data || error.message}`);
      } else {
        toast.error("Błąd podczas generowania lekcji");
      }
    } finally {
      setIsGeneratingAI(false);
    }
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
        <div className="flex gap-2">
          <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleOpenAIModal}
                variant="outline"
                disabled={isCreating || isUpdating}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generuj AI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Wygeneruj lekcje za pomocą AI</DialogTitle>
                <DialogDescription>
                  Opisz kurs, a AI wygeneruje dla Ciebie listę lekcji.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="aiPrompt" className="text-sm font-medium">
                    Opis kursu
                  </label>
                  <Textarea
                    id="aiPrompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Np. Kurs geografii na poziomie maturalnym, obejmujący geografię fizyczną, społeczno-ekonomiczną, regiony świata..." 
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
                  Anuluj
                </Button>
                <Button
                  onClick={generateLessonsWithAI}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generowanie...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Wygeneruj lekcje
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={toogleCreating} variant="ghost" disabled={isUpdating}>
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
