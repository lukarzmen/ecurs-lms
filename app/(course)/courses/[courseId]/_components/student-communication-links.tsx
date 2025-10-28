"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { CourseCommunication } from "@prisma/client";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StudentCommunicationLinksProps {
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

export const StudentCommunicationLinks = ({ courseId }: StudentCommunicationLinksProps) => {
  const [communicationLinks, setCommunicationLinks] = useState<CourseCommunication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchCommunicationLinks = useCallback(async () => {
    try {
      setIsLoading(true);
      // Create a public endpoint for students to view communication links
      const response = await axios.get(`/api/courses/${courseId}/communication/public`);
      setCommunicationLinks(response.data);
    } catch (error) {
      console.error("Failed to fetch communication links:", error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCommunicationLinks();
  }, [fetchCommunicationLinks]);

  const openLink = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
    setOpen(false); // Close popover after clicking
  };

  if (communicationLinks.length === 0 && !isLoading) {
    return null; // Don't show anything if no communication links
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 sm:gap-2 relative min-w-0"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Komunikacja</span>
          <span className="sm:hidden">Czat</span>
          {communicationLinks.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
              {communicationLinks.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 sm:w-80 p-0" align="end" side="bottom" sideOffset={5}>
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm mb-2 sm:mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Kanały komunikacji</span>
            <span className="sm:hidden">Komunikacja</span>
          </h3>
          
          {isLoading ? (
            <div className="text-sm text-slate-500 italic">Ładowanie...</div>
          ) : communicationLinks.length === 0 ? (
            <div className="text-sm text-slate-500 italic">
              Brak dostępnych kanałów komunikacji
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {communicationLinks
                .filter(link => link.isActive) // Only show active links
                .map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors cursor-pointer group min-h-[48px] sm:min-h-0"
                    onClick={() => openLink(link.link)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <span className="text-base sm:text-lg shrink-0">
                        {platformIcons[link.platform]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="font-medium text-sm truncate">
                            {platformLabels[link.platform]}
                          </span>
                          {link.label && (
                            <span className="hidden sm:inline text-xs text-slate-600 bg-white px-2 py-1 rounded">
                              {link.label}
                            </span>
                          )}
                        </div>
                        {link.description && (
                          <p className="hidden sm:block text-xs text-slate-600 mt-1 truncate">
                            {link.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                  </div>
                ))}
            </div>
          )}
          
          {communicationLinks.length > 0 && (
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t text-xs text-slate-500">
              <span className="hidden sm:inline">💡 Kliknij na kanał, aby dołączyć do rozmowy</span>
              <span className="sm:hidden">💡 Kliknij aby dołączyć</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StudentCommunicationLinks;