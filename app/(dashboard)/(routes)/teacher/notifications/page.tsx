"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
// import OpenAIService from "@/services/OpenAIService";

const notificationTypes = [
  {
    key: "newLesson",
    label: "Nowa lekcja w zapisanym kursie",
    prompt: "Napisz dłuższe, ciekawe powiadomienie o nowej lekcji w kursie, który użytkownik zapisał. Użyj zmiennych {{user}} i {{course}} w treści.",
    defaultText: "Cześć {{user}}, w Twoim kursie '{{course}}' pojawiła się nowa lekcja! Sprawdź ją już teraz i kontynuuj swoją edukacyjną podróż.",
    defaultTime: "09:00"
  },
  {
    key: "newCoursePath",
    label: "Nowy kurs w zapisanej ścieżce",
    prompt: "Napisz dłuższe, ciekawe powiadomienie o nowym kursie w ścieżce, którą użytkownik zapisał. Użyj zmiennych {{user}} i {{course}} w treści.",
    defaultText: "Hej {{user}}, właśnie dodaliśmy nowy kurs '{{course}}' do Twojej ścieżki edukacyjnej! Odkryj nowe możliwości rozwoju już dziś.",
    defaultTime: "10:00"
  },
  {
    key: "noActivity",
    label: "Brak aktywności w zapisanych kursach",
    prompt: "Napisz dłuższe, motywujące powiadomienie o braku aktywności w kursach zapisanych przez użytkownika. Użyj zmiennych {{user}} i {{course}} w treści.",
    defaultText: "{{user}}, nie zauważyliśmy Twojej aktywności w kursie '{{course}}'. Wróć do nauki i osiągnij swoje cele!",
    defaultTime: "11:00"
  },
  {
    key: "noPayment",
    label: "Brak płatności",
    prompt: "Napisz dłuższe, uprzejme powiadomienie o braku płatności za kurs. Użyj zmiennych {{user}} i {{course}} w treści.",
    defaultText: "{{user}}, nie odnotowaliśmy płatności za kurs '{{course}}'. Sprawdź szczegóły i dokończ transakcję, aby kontynuować naukę.",
    defaultTime: "12:00"
  },
];

export default function NotificationsPage() {
  const [selectedType, setSelectedType] = useState(notificationTypes[0].key);
  const [notification, setNotification] = useState(notificationTypes[0].defaultText);
  const [scheduleTime, setScheduleTime] = useState(notificationTypes[0].defaultTime);
  const [loading, setLoading] = useState(false);
  const [testUser, setTestUser] = useState("");
  const [testCourse, setTestCourse] = useState("");
  const [testResult, setTestResult] = useState("");

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = notificationTypes.find(t => t.key === e.target.value);
    setSelectedType(e.target.value);
    setNotification(type?.defaultText || "");
    setScheduleTime(type?.defaultTime || "09:00");
    setTestResult("");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNotification(e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleTime(e.target.value);
  };

  const handleTestUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestUser(e.target.value);
  };

  const handleTestCourseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestCourse(e.target.value);
  };

  const generateNotification = async () => {
    setLoading(true);
    try {
      const type = notificationTypes.find(t => t.key === selectedType);
      if (!type) return;
      const payload = {
        systemPrompt: "Jesteś asystentem LMS. Tworzysz dłuższe, ciekawe powiadomienia dla użytkowników. Używaj zmiennych {{user}} i {{course}} w treści. Powiadomienie nie powinno mieć więcej niż 6 zdań.",
        userPrompt: type.prompt + " Powiadomienie nie powinno mieć więcej niż 6 zdań.",
      };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.text();
      setNotification(data || "");
      toast.success("Wygenerowano domyślny tekst powiadomienia");
    } catch (err) {
      console.error("Error generating notification:", err);
      toast.error("Błąd generowania powiadomienia");
    } finally {
      setLoading(false);
    }
  };

  const testNotification = () => {
    if (!testUser || !testCourse) {
      toast.error("Podaj nazwę użytkownika i kursu do testu");
      return;
    }
    // Replace template variables
    const text = notification.replace(/{{user}}/g, testUser).replace(/{{course}}/g, testCourse);
    setTestResult(text);
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <Card className="p-6 bg-orange-50">
        <h2 className="text-2xl font-bold mb-4 text-orange-700">Konfiguracja powiadomień</h2>
        <div className="mb-4 text-sm text-gray-700 bg-orange-100 rounded p-2">
          Możesz użyć zmiennych <span className="font-mono bg-white px-1">{'{{user}}'}</span> i <span className="font-mono bg-white px-1">{'{{course}}'}</span> w treści powiadomienia. Zostaną one zastąpione odpowiednimi danymi podczas wysyłki.
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Typ powiadomienia</label>
          <select
            value={selectedType}
            onChange={handleTypeChange}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          >
            {notificationTypes.map(type => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Treść powiadomienia</label>
          <textarea
            value={notification}
            onChange={handleTextChange}
            rows={4}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Godzina wysyłki</label>
          <input
            type="time"
            value={scheduleTime}
            onChange={handleTimeChange}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <Button onClick={generateNotification} disabled={loading} className="bg-orange-600 text-white w-full mb-4">
          {loading ? "Generowanie domyślnego tekstu..." : "Wygeneruj domyślny tekst"}
        </Button>
        <div className="mt-4 p-4 bg-white rounded-md border text-orange-700">
          <strong>Aktualna treść powiadomienia:</strong>
          <p className="mt-2 whitespace-pre-line">{notification}</p>
          <div className="mt-2 text-sm text-gray-600">Godzina wysyłki: <span className="font-semibold">{scheduleTime}</span></div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-orange-700">Testuj powiadomienie</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Nazwa użytkownika"
              value={testUser}
              onChange={handleTestUserChange}
              className="w-1/2 p-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
            <input
              type="text"
              placeholder="Nazwa kursu"
              value={testCourse}
              onChange={handleTestCourseChange}
              className="w-1/2 p-2 border rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
            <Button onClick={testNotification} className="bg-orange-500 text-white">Testuj</Button>
          </div>
          {testResult && (
            <div className="mt-2 p-3 bg-orange-50 border rounded text-orange-900">
              <strong>Powiadomienie testowe:</strong>
              <p className="mt-1 whitespace-pre-line">{testResult}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
