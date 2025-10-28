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
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { PlusCircle, ExternalLink, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { CommunicationPlatform, CourseCommunication } from "@prisma/client";
import { useRouter } from "next/navigation";

type CommunicationPlatformType = CommunicationPlatform;

const formSchema = z.object({
  platform: z.nativeEnum(CommunicationPlatform, {
    required_error: "Wybierz platformę",
  }),
  link: z.string().min(1, "Link jest wymagany").url("Podaj prawidłowy URL"),
  label: z.string().optional(),
  description: z.string().optional(),
});

interface CommunicationLinksFormProps {
  courseId: string;
}

const platformLabels = {
  WHATSAPP: "WhatsApp",
  TELEGRAM: "Telegram",
  DISCORD: "Discord",
  SLACK: "Slack",
  TEAMS: "Microsoft Teams",
  ZOOM: "Zoom",
  CUSTOM: "Niestandardowy",
};

const platformIcons = {
  WHATSAPP: "💬",
  TELEGRAM: "📱",
  DISCORD: "🎮",
  SLACK: "💼",
  TEAMS: "👥",
  ZOOM: "📹",
  CUSTOM: "🔗",
};

export const CommunicationLinksForm = ({ courseId }: CommunicationLinksFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [communicationLinks, setCommunicationLinks] = useState<CourseCommunication[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: CommunicationPlatform.WHATSAPP,
      link: "",
      label: "",
      description: "",
    },
  });

  const router = useRouter();
  const { isSubmitting, isValid } = form.formState;

  const fetchCommunicationLinks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/courses/${courseId}/communication`);
      setCommunicationLinks(response.data);
    } catch (error) {
      toast.error("Nie udało się pobrać linków komunikacyjnych");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCommunicationLinks();
  }, [fetchCommunicationLinks]);

  const toggleCreating = () => {
    setIsCreating((current) => !current);
    if (isCreating) {
      form.reset();
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/communication`, values);
      toast.success("Link komunikacyjny dodany");
      toggleCreating();
      form.reset();
      fetchCommunicationLinks();
    } catch (error) {
      toast.error("Coś poszło nie tak");
      console.error(error);
    }
  };

  const onDelete = async (linkId: number) => {
    try {
      await axios.delete(`/api/courses/${courseId}/communication/${linkId}`);
      toast.success("Link usunięty");
      fetchCommunicationLinks();
    } catch (error) {
      toast.error("Nie udało się usunąć linku");
      console.error(error);
    }
  };

  const openLink = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <div className="relative mt-6 border bg-orange-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Kanały komunikacji
        <Button onClick={toggleCreating} variant="ghost">
          {isCreating ? (
            <>Anuluj</>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Dodaj kanał
            </>
          )}
        </Button>
      </div>

      {isCreating && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platforma</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      {Object.entries(platformLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {platformIcons[value as CommunicationPlatformType]} {label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etykieta (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="np. Grupa główna, Q&A"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nazwa opisująca przeznaczenie kanału
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder="Opisz przeznaczenie tego kanału komunikacji..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Dodaj kanał
              </Button>
            </div>
          </form>
        </Form>
      )}

      {!isCreating && (
        <div className="space-y-3 mt-4">
          {isLoading ? (
            <div className="text-sm text-slate-500 italic">Ładowanie...</div>
          ) : communicationLinks.length === 0 ? (
            <div className="text-sm text-slate-500 italic">
              Brak kanałów komunikacji. Dodaj pierwszy kanał, aby ułatwić kontakt z uczestnikami.
            </div>
          ) : (
            communicationLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-white rounded-md border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">
                    {platformIcons[link.platform]}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {platformLabels[link.platform]}
                      </span>
                      {link.label && (
                        <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {link.label}
                        </span>
                      )}
                    </div>
                    {link.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {link.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {link.link}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openLink(link.link)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!isCreating && communicationLinks.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4">
          💡 Tip: Dodaj różne kanały dla różnych celów - np. główna grupa do dyskusji, 
          osobny kanał do pytań, czy kanał ogłoszeń.
        </p>
      )}
    </div>
  );
};

export default CommunicationLinksForm;