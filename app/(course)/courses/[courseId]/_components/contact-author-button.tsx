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
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { userId } = useAuth();
  const [studentName, setStudentName] = useState("");

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
          systemPrompt:
            "Jesteś pomocnym asystentem studenta. Twoim zadaniem jest generowanie uprzejmych pytań do prowadzącego kursu.",
          userPrompt: `Wygeneruj uprzejme wprowadzenie do pytania dla prowadzącego kurs "${courseTitle}". Wiadomość powinna być profesjonalna i grzeczna, z miejscem na dodanie konkretnego pytania. Długość: 2-3 zdania.`,
        },
        feedback: {
          systemPrompt:
            "Jesteś pomocnym asystentem studenta. Twoim zadaniem jest generowanie pozytywnych opinii o kursie.",
          userPrompt: `Wygeneruj pozytywną opinię o kursie "${courseTitle}" dla prowadzącego ${authorName}. Wiadomość powinna być szczera i konstruktywna. Długość: 2-3 zdania.`,
        },
        help: {
          systemPrompt:
            "Jesteś pomocnym asystentem studenta. Twoim zadaniem jest generowanie próśb o pomoc.",
          userPrompt: `Wygeneruj uprzejmą prośbę o pomoc dla prowadzącego kurs "${courseTitle}". Wiadomość powinna być grzeczna z miejscem na opisanie problemu. Długość: 2-3 zdania.`,
        },
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompts[type]),
      });

      if (!response.ok) {
        throw new Error("Failed to generate message");
      }

      const generatedMessage = await response.text();
      setMessage(generatedMessage);
      toast.success("Wiadomość wygenerowana przez AI!");
    } catch (error) {
      console.error("Error generating AI message:", error);
      toast.error("Nie udało się wygenerować wiadomości. Spróbuj ponownie.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      toast.error("Wpisz treść wiadomości");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: authorEmail,
          subject: `Wiadomość od studenta: ${courseTitle}`,
          text: `Od: ${studentName || "Student"}\nKurs: ${courseTitle}\n\n${message}`,
          useSSL: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      toast.success("Wysłano wiadomość do prowadzącego!");
      setIsOpen(false);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Nie udało się wysłać wiadomości. Spróbuj ponownie później.");
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
          <span className="hidden sm:inline">Kontakt z autorem</span>
          <span className="sm:hidden">Autor</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-600" />
            Kontakt z autorem kursu
          </DialogTitle>
          <DialogDescription>
            Wyślij wiadomość do <strong>{authorName}</strong> dotyczącą kursu{" "}
            <strong>{courseTitle}</strong>
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
              Pytanie
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
              Opinia
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
              Pomoc
            </Button>
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Twoja wiadomość</label>
            <Textarea
              placeholder="Napisz wiadomość do autora kursu..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] resize-none"
              disabled={isGenerating || isSending}
            />
            <p className="text-xs text-slate-500">
              {message.length} / 2000 znaków
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
              Anuluj
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
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Wyślij
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
