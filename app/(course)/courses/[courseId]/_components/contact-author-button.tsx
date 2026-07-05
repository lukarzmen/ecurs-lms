"use client";

import { useState } from "react";
import { Mail, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useI18n } from "@/hooks/use-i18n";

interface ContactAuthorButtonProps {
  courseId: string;
  authorEmail: string;
  authorName: string;
  courseTitle: string;
}

export const ContactAuthorButton = ({
  courseId,
  authorEmail,
  authorName,
  courseTitle,
}: ContactAuthorButtonProps) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { userId } = useAuth();
  const [studentName, setStudentName] = useState("");

  const formatMessage = (key: string, replacements: Record<string, string | number> = {}) => {
    return Object.entries(replacements).reduce((msg, [token, value]) => {
      return msg.replaceAll(`{${token}}`, String(value));
    }, t(key));
  };

  // Fetch student name when dialog opens
  const fetchStudentName = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/user?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStudentName(data.email);
      }
    } catch (error) {
      console.error("Error fetching student name:", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchStudentName();
    } else {
      setMessage("");
    }
  };

  const generateAIMessage = async (type: "question" | "feedback" | "help") => {
    setIsGenerating(true);
    try {
      const prompts = {
        question: {
          systemPrompt: t("contactAuthor.aiPrompt.question.system"),
          userPrompt: formatMessage("contactAuthor.aiPrompt.question.user", {
            courseTitle,
          }),
        },
        feedback: {
          systemPrompt: t("contactAuthor.aiPrompt.feedback.system"),
          userPrompt: formatMessage("contactAuthor.aiPrompt.feedback.user", {
            courseTitle,
            authorName,
          }),
        },
        help: {
          systemPrompt: t("contactAuthor.aiPrompt.help.system"),
          userPrompt: formatMessage("contactAuthor.aiPrompt.help.user", {
            courseTitle,
          }),
        },
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompts[type]),
      });

      if (!response.ok) {
        throw new Error(t("contactAuthor.errors.generateFailed"));
      }

      const generatedMessage = await response.text();
      setMessage(generatedMessage);
      toast.success(t("contactAuthor.toast.aiGenerated"));
    } catch (error) {
      console.error("Error generating AI message:", error);
      toast.error(t("contactAuthor.toast.aiGenerateError"));
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      toast.error(t("contactAuthor.toast.enterMessage"));
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: authorEmail,
          subject: formatMessage("contactAuthor.email.subject", { courseTitle }),
          text: formatMessage("contactAuthor.email.body", {
            student: studentName || t("contactAuthor.email.studentFallback"),
            courseTitle,
            message,
          }),
          useSSL: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("contactAuthor.errors.sendFailed"));
      }

      toast.success(t("contactAuthor.toast.sent"));
      setIsOpen(false);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("contactAuthor.toast.sendLaterError"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 sm:gap-2 min-w-0"
        >
          <Mail className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{t("contactAuthor.buttonFull")}</span>
          <span className="sm:hidden">{t("contactAuthor.buttonShort")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-600" />
            {t("contactAuthor.dialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {formatMessage("contactAuthor.dialogDescription", {
              authorName,
              courseTitle,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* AI Generation Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => generateAIMessage("question")}
              disabled={isGenerating || isSending}
              className="flex items-center gap-1 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              {t("contactAuthor.ai.question")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => generateAIMessage("feedback")}
              disabled={isGenerating || isSending}
              className="flex items-center gap-1 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              {t("contactAuthor.ai.feedback")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => generateAIMessage("help")}
              disabled={isGenerating || isSending}
              className="flex items-center gap-1 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              {t("contactAuthor.ai.help")}
            </Button>
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("contactAuthor.messageLabel")}</label>
            <Textarea
              placeholder={t("contactAuthor.messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] resize-none"
              disabled={isGenerating || isSending}
            />
            <p className="text-xs text-slate-500">
              {formatMessage("contactAuthor.messageCount", { count: message.length })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={sendMessage}
              disabled={isSending || !message.trim() || isGenerating}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("contactAuthor.sending")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t("contactAuthor.send")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
