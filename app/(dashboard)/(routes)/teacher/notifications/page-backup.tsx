"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { UserResponse } from "@/app/api/user/route";
import { Bell, Settings, Mail, Clock } from "lucide-react";
// import OpenAIService from "@/services/OpenAIService";

const notificationTypes = [
	{
		key: "newLesson",
		label: "Nowa lekcja w zapisanym kursie",
		prompt: "Napisz dłuższe, ciekawe powiadomienie o nowej lekcji w kursie, który użytkownik zapisał. Użyj zmiennych {{user}} i {{course}} w treści.",
		defaultText: "Cześć {{user}}, w Twoim kursie '{{course}}' pojawiła się nowa lekcja! Sprawdź ją już teraz i kontynuuj swoją edukacyjną podróż.",
		defaultTime: "09:00",
	},
	{
		key: "newCoursePath",
		label: "Nowy kurs w zapisanej ścieżce",
		prompt: "Napisz dłuższe, ciekawe powiadomienie o nowym kursie w ścieżce, którą użytkownik zapisał. Użyj zmiennych {{user}} i {{course}} w treści.",
		defaultText: "Hej {{user}}, właśnie dodaliśmy nowy kurs '{{course}}' do Twojej ścieżki edukacyjnej! Odkryj nowe możliwości rozwoju już dziś.",
		defaultTime: "10:00",
	},
	{
		key: "noActivity",
		label: "Brak aktywności w zapisanych kursach",
		prompt: "Napisz dłuższe, motywujące powiadomienie o braku aktywności w kursach zapisanych przez użytkownika. Użyj zmiennych {{user}} i {{course}} w treści.",
		defaultText: "{{user}}, nie zauważyliśmy Twojej aktywności w kursie '{{course}}'. Wróć do nauki i osiągnij swoje cele!",
		defaultTime: "11:00",
	},
	{
		key: "noPayment",
		label: "Brak płatności",
		prompt: "Napisz dłuższe, uprzejme powiadomienie o braku płatności za kurs. Użyj zmiennych {{user}} i {{course}} w treści.",
		defaultText: "{{user}}, nie odnotowaliśmy płatności za kurs '{{course}}'. Sprawdź szczegóły i dokończ transakcję, aby kontynuować naukę.",
		defaultTime: "12:00",
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
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);
	const { userId, sessionId } = useAuth();

	const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const type = notificationTypes.find((t) => t.key === e.target.value);
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
			const type = notificationTypes.find((t) => t.key === selectedType);
			if (!type) return;
			const payload = {
				systemPrompt: "Jesteś asystentem LMS. Tworzysz dłuższe, ciekawe powiadomienia dla użytkowników. Używaj zmiennych {{user}} i {{course}} w treści. Powiadomienie nie powinno mieć więcej niż 6 zdań.",
				userPrompt: type.prompt + " Powiadomienie nie powinno mieć więcej niż 6 zdań.",
			};
			const res = await fetch("/api/tasks", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("API error");
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

	const sendTestEmail = async () => {
		setLoading(true);
		try {
			// Fetch user data to get email
			if (!userId) {
				throw new Error("Brak userId do pobrania danych użytkownika");
			}
      const userRes = await fetch(`/api/user?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(sessionId ?? "")}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
			if (!userRes.ok) throw new Error("User API error");
			const userData: UserResponse = await userRes.json();
			const email = userData.email;

			const res = await fetch("/api/notifications/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					to: email,
					subject: "Test powiadomienia z ecurs",
					text: notification.replace(/{{user}}/g, testUser || "TestUser").replace(/{{course}}/g, testCourse || "TestCourse"),
					useSSL: false,
				}),
			});
			if (!res.ok) throw new Error("API error");
			toast.success("Testowy email został wysłany");
		} catch (err) {
			toast.error("Błąd wysyłania testowego emaila");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 space-y-8">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
						<Bell className="h-8 w-8 text-orange-600" />
						<span>Powiadomienia</span>
					</h1>
					<p className="text-gray-600 mt-2">
						Konfiguruj i zarządzaj powiadomieniami dla swoich studentów
					</p>
				</div>
			</div>

			{/* Notifications Configuration Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Settings className="h-5 w-5 text-orange-600" />
						<span>Konfiguracja powiadomień</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Enable/Disable Notifications */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">Włącz powiadomienia</label>
						<div className="flex gap-4">
							<label className="flex items-center">
								<input
									type="radio"
									name="notificationsEnabled"
									checked={notificationsEnabled}
									onChange={() => setNotificationsEnabled(true)}
									className="mr-2 text-orange-600 focus:ring-orange-500"
								/>
								<span className="text-sm">Włączone</span>
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									name="notificationsEnabled"
									checked={!notificationsEnabled}
									onChange={() => setNotificationsEnabled(false)}
									className="mr-2 text-orange-600 focus:ring-orange-500"
								/>
								<span className="text-sm">Wyłączone</span>
							</label>
						</div>
					</div>

					{/* Template Variables Info */}
					<div className="text-sm text-gray-700 bg-orange-50 border border-orange-200 rounded-lg p-4">
						<p className="font-medium text-orange-800 mb-2">Dostępne zmienne:</p>
						<p>Możesz użyć zmiennych{" "}
							<span className="font-mono bg-white px-2 py-1 rounded border">{`{{user}}`}</span>{" "}i{" "}
							<span className="font-mono bg-white px-2 py-1 rounded border">{`{{course}}`}</span>{" "}
							w treści powiadomienia. Zostaną one zastąpione odpowiednimi danymi podczas wysyłki.
						</p>
					</div>

					{/* Notification Type */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Typ powiadomienia</label>
						<select
							value={selectedType}
							onChange={handleTypeChange}
							className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
						>
							{notificationTypes.map((type) => (
								<option key={type.key} value={type.key}>
									{type.label}
								</option>
							))}
						</select>
					</div>

					{/* Notification Content */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Treść powiadomienia</label>
						<textarea
							value={notification}
							onChange={handleTextChange}
							rows={4}
							className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
							placeholder="Wprowadź treść powiadomienia..."
						/>
					</div>

					{/* Schedule Time */}
					<div>
						<label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
							<Clock className="h-4 w-4 text-orange-600" />
							Godzina wysyłki
						</label>
						<input
							type="time"
							value={scheduleTime}
							onChange={handleTimeChange}
							className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3">
						<Button 
							onClick={generateNotification} 
							disabled={loading} 
							className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
						>
							{loading ? "Generowanie..." : "Wygeneruj domyślny tekst"}
						</Button>
						<Button 
							onClick={sendTestEmail} 
							disabled={loading} 
							variant="outline"
							className="border-orange-600 text-orange-600 hover:bg-orange-50 flex-1 flex items-center gap-2"
						>
							<Mail className="h-4 w-4" />
							Wyślij testowy email
						</Button>
					</div>

					{/* Current Notification Preview */}
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<h4 className="font-medium text-gray-900 mb-3">Podgląd powiadomienia:</h4>
						<div className="bg-white border border-gray-200 rounded-lg p-3">
							<p className="text-gray-800 whitespace-pre-line">{notification}</p>
						</div>
						<div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
							<Clock className="h-4 w-4" />
							Godzina wysyłki: <span className="font-semibold">{scheduleTime}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Test Notification Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Mail className="h-5 w-5 text-orange-600" />
						<span>Testuj powiadomienie</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Nazwa użytkownika</label>
							<input
								type="text"
								placeholder="np. Jan Kowalski"
								value={testUser}
								onChange={handleTestUserChange}
								className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Nazwa kursu</label>
							<input
								type="text"
								placeholder="np. JavaScript dla początkujących"
								value={testCourse}
								onChange={handleTestCourseChange}
								className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
							/>
						</div>
					</div>
					
					<Button 
						onClick={testNotification} 
						className="bg-orange-600 hover:bg-orange-700 text-white w-full"
					>
						Wygeneruj podgląd testu
					</Button>

					{testResult && (
						<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
							<h4 className="font-medium text-orange-800 mb-2">Powiadomienie testowe:</h4>
							<div className="bg-white border border-orange-200 rounded-lg p-3">
								<p className="text-gray-800 whitespace-pre-line">{testResult}</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
