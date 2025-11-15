"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

interface ModulePublicationScheduleProps {
  courseId: string;
  chapterId: string;
}

interface PublicationData {
  module: {
    id: number;
    title: string;
    state: number;
    publishedAt: string | null;
    updatedAt: string;
  };
  isScheduled: boolean;
  isPublished: boolean;
}

export const ModulePublicationSchedule = ({ 
  courseId, 
  chapterId 
}: ModulePublicationScheduleProps) => {
  const [publicationData, setPublicationData] = useState<PublicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Load current publication status
  const loadPublicationData = useCallback(async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/chapters/${chapterId}/schedule`);
      setPublicationData(response.data);
      
      // Pre-fill form if module is scheduled
      if (response.data.isScheduled && response.data.module.publishedAt) {
        const publishDate = new Date(response.data.module.publishedAt);
        setScheduledDate(publishDate.toISOString().split('T')[0]);
        setScheduledTime(publishDate.toTimeString().slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading publication data:', error);
      toast.error('Błąd podczas ładowania danych publikacji');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId]);

  useEffect(() => {
    loadPublicationData();
  }, [loadPublicationData]);

  // Schedule publication
  const schedulePublication = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Wybierz datę i godzinę publikacji');
      return;
    }

    const publishDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    if (publishDateTime <= new Date()) {
      toast.error('Data publikacji musi być w przyszłości');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/schedule`, {
        publishedAt: publishDateTime.toISOString(),
      });
      
      toast.success('Zaplanowano publikację modułu');
      await loadPublicationData();
    } catch (error) {
      console.error('Error scheduling publication:', error);
      toast.error('Błąd podczas planowania publikacji');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel scheduled publication
  const cancelScheduledPublication = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`/api/courses/${courseId}/chapters/${chapterId}/schedule`);
      
      toast.success('Anulowano zaplanowaną publikację');
      setScheduledDate('');
      setScheduledTime('');
      await loadPublicationData();
    } catch (error) {
      console.error('Error cancelling publication:', error);
      toast.error('Błąd podczas anulowania publikacji');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish immediately
  const publishImmediately = async () => {
    setIsSubmitting(true);
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
        state: 1, // Published state
      });
      
      toast.success('Moduł został opublikowany');
      await loadPublicationData();
    } catch (error) {
      console.error('Error publishing immediately:', error);
      toast.error('Błąd podczas publikowania');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unpublish module (revert to draft)
  const unpublishModule = async () => {
    setIsSubmitting(true);
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
        state: 0, // Draft state
      });
      
      toast.success('Moduł został wycofany z publikacji');
      await loadPublicationData();
    } catch (error) {
      console.error('Error unpublishing:', error);
      toast.error('Błąd podczas wycofywania publikacji');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Publikacja modułu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Ładowanie...</p>
        </CardContent>
      </Card>
    );
  }

  if (!publicationData) {
    return null;
  }

  const { module, isScheduled, isPublished } = publicationData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Publikacja modułu
          </div>
          <div>
            {isPublished && (
              <Badge variant="default" className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Opublikowany
              </Badge>
            )}
            {isScheduled && !isPublished && (
              <Badge variant="secondary" className="bg-blue-500 text-white">
                <Clock className="h-3 w-3 mr-1" />
                Zaplanowany
              </Badge>
            )}
            {!isPublished && !isScheduled && (
              <Badge variant="outline">
                Wersja robocza
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPublished ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Moduł jest opublikowany</strong><br />
                Dostępny dla uczestników kursu
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={unpublishModule}
              disabled={isSubmitting}
              className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50"
            >
              <X className="h-4 w-4 mr-2" />
              Wycofaj z publikacji (wróć do szkicu)
            </Button>
          </div>
        ) : isScheduled ? (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Zaplanowana publikacja:</strong><br />
                {module.publishedAt && new Date(module.publishedAt).toLocaleString('pl-PL')}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={cancelScheduledPublication}
              disabled={isSubmitting}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Anuluj zaplanowaną publikację
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Moduł jest w przygotowaniu (szkic)</strong><br />
                Nie jest jeszcze dostępny dla uczestników
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="scheduledDate">Data publikacji</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="scheduledTime">Godzina publikacji</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={publishImmediately}
                disabled={isSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Publikuj teraz
              </Button>
              <Button 
                variant="outline"
                onClick={schedulePublication}
                disabled={isSubmitting}
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                Zaplanuj publikację
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Zaplanowane moduły zostaną automatycznie opublikowane przez system o wybranej dacie i godzinie
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};