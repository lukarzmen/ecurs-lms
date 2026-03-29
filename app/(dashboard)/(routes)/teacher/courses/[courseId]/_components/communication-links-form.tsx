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
import { FormCard, FormActions, FormSection } from "@/components/ui/form-card";
import { z } from "zod";
import { PlusCircle, ExternalLink, Trash2, MessageSquare } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";
import { CommunicationPlatform, CourseCommunication } from "@prisma/client";
import { useRouter } from "next/navigation";

type CommunicationPlatformType = CommunicationPlatform;

const formSchema = z.object({
  platform: z.nativeEnum(CommunicationPlatform, {
    required_error: "commForm.selectPlatform",
  }),
  link: z.string().min(1, "commForm.linkRequired").url("commForm.invalidUrl"),
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
  CUSTOM: "Custom",
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
  const { t } = useI18n();

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
      toast.error(t('commForm.fetchError'));
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
      toast.success(t('commForm.linkAdded'));
      toggleCreating();
      form.reset();
      fetchCommunicationLinks();
    } catch (error) {
      toast.error(t('courseForm.somethingWrong'));
      console.error(error);
    }
  };

  const onDelete = async (linkId: number) => {
    try {
      await axios.delete(`/api/courses/${courseId}/communication/${linkId}`);
      toast.success(t('commForm.linkDeleted'));
      fetchCommunicationLinks();
    } catch (error) {
      toast.error(t('commForm.linkDeleteError'));
      console.error(error);
    }
  };

  const openLink = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <div className="mt-6">
      <FormCard
        title={t('commForm.channels')}
        icon={MessageSquare}
        status={{
          label: isCreating ? t('chaptersForm.adding') : (communicationLinks.length > 0 ? t('commForm.channelCount').replace('{count}', String(communicationLinks.length)) : t('commForm.noChannels')),
          variant: isCreating ? "secondary" : (communicationLinks.length > 0 ? "default" : "outline"),
          className: isCreating ? "bg-blue-500 text-white" : (communicationLinks.length > 0 ? "bg-green-500" : "")
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{t('commForm.platformsSubtitle')}</span>
          <Button onClick={toggleCreating} variant="ghost" size="sm">
            {isCreating ? (
              <>{t('courseForm.cancel')}</>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                {t('commForm.addChannel')}
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
                  <FormLabel>{t('commForm.platform')}</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      {Object.entries(platformLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {platformIcons[value as CommunicationPlatformType]} {value === 'CUSTOM' ? t('commForm.custom') : label}
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
                  <FormLabel>{t('commForm.link')}</FormLabel>
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
                  <FormLabel>{t('commForm.labelOptional')}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder={t('commForm.labelPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('commForm.labelDesc')}
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
                  <FormLabel>{t('commForm.descOptional')}</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder={t('commForm.descPlaceholder')}
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
                {t('commForm.addChannel')}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {!isCreating && (
        <div>
          {isLoading ? (
            <FormSection variant="info">
              <p>{t('commForm.loading')}</p>
            </FormSection>
          ) : communicationLinks.length === 0 ? (
            <FormSection variant="warning">
              <p>
                <strong>{t('commForm.noChannelsTitle')}</strong><br />
                {t('commForm.noChannelsHint')}
              </p>
            </FormSection>
          ) : (
            <div className="space-y-3">
              {communicationLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-lg">
                      {platformIcons[link.platform]}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {link.platform === 'CUSTOM' ? t('commForm.custom') : platformLabels[link.platform]}
                        </span>
                        {link.label && (
                          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                            {link.label}
                          </span>
                        )}
                      </div>
                      {link.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 truncate">
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
                      variant="ghost"
                      className="h-4 w-8 p-0"
                      onClick={() => onDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {communicationLinks.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4">
              💡 {t('commForm.tip')}
            </p>
          )}
        </div>
      )}
      </FormCard>
    </div>
  );
};

export default CommunicationLinksForm;