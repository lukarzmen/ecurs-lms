"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { UserResponse } from "@/app/api/user/route";
import { Bell, Settings, Mail, Clock, Calendar, Plus, Edit, Trash2, Play, Pause, History } from "lucide-react";

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

const cronPresets = [
	{ label: "Codziennie o 9:00", value: "0 9 * * *" },
	{ label: "Codziennie o 18:00", value: "0 18 * * *" },
	{ label: "W poniedziałki o 10:00", value: "0 10 * * 1" },
	{ label: "W środy o 14:00", value: "0 14 * * 3" },
	{ label: "W piątki o 16:00", value: "0 16 * * 5" },
	{ label: "Co tydzień (niedziela o 19:00)", value: "0 19 * * 0" },
	{ label: "Co miesiąc (1. dnia o 12:00)", value: "0 12 1 * *" },
	{ label: "Niestandardowe", value: "custom" },
];

interface NotificationSchedule {
	id: number;
	courseId: number;
	title: string;
	message: string;
	cronExpression: string;
	isEnabled: boolean;
	notificationType: string;
	createdAt: string;
	lastSentAt?: string;
	course: {
		id: number;
		title: string;
	};
	sentLogs: Array<{
		id: number;
		sentAt: string;
		status: string;
		recipientEmail: string;
	}>;
}

interface Course {
	id: number;
	title: string;
}

export default function NotificationsPage() {
	// Existing state
	const [selectedType, setSelectedType] = useState(notificationTypes[0].key);
	const [notification, setNotification] = useState(notificationTypes[0].defaultText);
	const [scheduleTime, setScheduleTime] = useState(notificationTypes[0].defaultTime);
	const [loading, setLoading] = useState(false);
	const [testUser, setTestUser] = useState("");
	const [testCourse, setTestCourse] = useState("");
	const [testResult, setTestResult] = useState("");
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);
	
	// New state for scheduling
	const [activeTab, setActiveTab] = useState<'create' | 'schedules'>('create');
	const [courses, setCourses] = useState<Course[]>([]);
	const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingSchedule, setEditingSchedule] = useState<NotificationSchedule | null>(null);
	
	// Schedule form state
	const [scheduleForm, setScheduleForm] = useState({
		courseId: '',
		title: '',
		message: '',
		cronExpression: '0 9 * * *',
		cronPreset: '0 9 * * *',
		notificationType: 'newLesson',
		isEnabled: true,
	});

	const { userId, sessionId } = useAuth();

	// Fetch user's courses
	useEffect(() => {
		const fetchCourses = async () => {
			try {
				const res = await fetch(`/api/courses?userId=${userId}`);
				if (res.ok) {
					const data = await res.json();
					setCourses(data);
				}
			} catch (error) {
				console.error('Error fetching courses:', error);
			}
		};

		const fetchSchedules = async () => {
			try {
				const res = await fetch('/api/notifications/schedules');
				if (res.ok) {
					const data = await res.json();
					setSchedules(data);
				}
			} catch (error) {
				console.error('Error fetching schedules:', error);
			}
		};

		if (userId) {
			fetchCourses();
			fetchSchedules();
		}
	}, [userId]);

	const fetchCourses = async () => {
		try {
			const res = await fetch(`/api/courses?userId=${userId}`);
			if (res.ok) {
				const data = await res.json();
				setCourses(data);
			}
		} catch (error) {
			console.error('Error fetching courses:', error);
		}
	};

	const fetchSchedules = async () => {
		try {
			const res = await fetch('/api/notifications/schedules');
			if (res.ok) {
				const data = await res.json();
				setSchedules(data);
			}
		} catch (error) {
			console.error('Error fetching schedules:', error);
		}
	};

	// Existing handlers
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

	// Schedule form handlers
	const handleScheduleFormChange = (field: string, value: any) => {
		setScheduleForm(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleCronPresetChange = (preset: string) => {
		if (preset === 'custom') {
			setScheduleForm(prev => ({ ...prev, cronPreset: preset }));
		} else {
			setScheduleForm(prev => ({
				...prev,
				cronPreset: preset,
				cronExpression: preset
			}));
		}
	};

	const resetScheduleForm = () => {
		setScheduleForm({
			courseId: '',
			title: '',
			message: '',
			cronExpression: '0 9 * * *',
			cronPreset: '0 9 * * *',
			notificationType: 'newLesson',
			isEnabled: true,
		});
	};

	// CRUD operations for schedules
	const createSchedule = async () => {
		if (!scheduleForm.courseId || !scheduleForm.title || !scheduleForm.message) {
			toast.error('Wypełnij wszystkie wymagane pola');
			return;
		}

		setLoading(true);
		try {
			const res = await fetch('/api/notifications/schedules', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(scheduleForm),
			});

			if (res.ok) {
				toast.success('Harmonogram powiadomień został utworzony');
				setShowCreateModal(false);
				resetScheduleForm();
				fetchSchedules();
			} else {
				const error = await res.text();
				toast.error(`Błąd: ${error}`);
			}
		} catch (error) {
			toast.error('Błąd tworzenia harmonogramu');
		} finally {
			setLoading(false);
		}
	};

	const updateSchedule = async () => {
		if (!editingSchedule) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/notifications/schedules/${editingSchedule.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: scheduleForm.title,
					message: scheduleForm.message,
					cronExpression: scheduleForm.cronExpression,
					isEnabled: scheduleForm.isEnabled,
					notificationType: scheduleForm.notificationType,
				}),
			});

			if (res.ok) {
				toast.success('Harmonogram został zaktualizowany');
				setEditingSchedule(null);
				setShowCreateModal(false);
				resetScheduleForm();
				fetchSchedules();
			} else {
				toast.error('Błąd aktualizacji harmonogramu');
			}
		} catch (error) {
			toast.error('Błąd aktualizacji harmonogramu');
		} finally {
			setLoading(false);
		}
	};

	const deleteSchedule = async (id: number) => {
		if (!confirm('Czy na pewno chcesz usunąć ten harmonogram?')) return;

		try {
			const res = await fetch(`/api/notifications/schedules/${id}`, {
				method: 'DELETE',
			});

			if (res.ok) {
				toast.success('Harmonogram został usunięty');
				fetchSchedules();
			} else {
				toast.error('Błąd usuwania harmonogramu');
			}
		} catch (error) {
			toast.error('Błąd usuwania harmonogramu');
		}
	};

	const toggleSchedule = async (id: number, isEnabled: boolean) => {
		try {
			const res = await fetch(`/api/notifications/schedules/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isEnabled: !isEnabled }),
			});

			if (res.ok) {
				toast.success(isEnabled ? 'Harmonogram został wyłączony' : 'Harmonogram został włączony');
				fetchSchedules();
			} else {
				toast.error('Błąd zmiany statusu harmonogramu');
			}
		} catch (error) {
			toast.error('Błąd zmiany statusu harmonogramu');
		}
	};

	const editSchedule = (schedule: NotificationSchedule) => {
		setEditingSchedule(schedule);
		
		// Find matching preset or set to custom
		const matchingPreset = cronPresets.find(p => p.value === schedule.cronExpression);
		
		setScheduleForm({
			courseId: schedule.courseId.toString(),
			title: schedule.title,
			message: schedule.message,
			cronExpression: schedule.cronExpression,
			cronPreset: matchingPreset?.value || 'custom',
			notificationType: schedule.notificationType,
			isEnabled: schedule.isEnabled,
		});
		setShowCreateModal(true);
	};

	// Existing functions
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
		const text = notification.replace(/{{user}}/g, testUser).replace(/{{course}}/g, testCourse);
		setTestResult(text);
	};

	const sendTestEmail = async () => {
		setLoading(true);
		try {
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

	const getCronDescription = (cronExpression: string) => {
		const preset = cronPresets.find(p => p.value === cronExpression);
		if (preset) {
			return preset.label;
		}
		
		// Basic cron description for custom expressions
		const parts = cronExpression.split(' ');
		if (parts.length === 5) {
			const [minute, hour, day, month, dayOfWeek] = parts;
			
			if (day === '*' && month === '*' && dayOfWeek === '*') {
				return `Codziennie o ${hour}:${minute.padStart(2, '0')}`;
			}
			if (day === '*' && month === '*' && dayOfWeek !== '*') {
				const days = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
				return `W ${days[parseInt(dayOfWeek)] || dayOfWeek} o ${hour}:${minute.padStart(2, '0')}`;
			}
		}
		
		return cronExpression;
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

			{/* Tab Navigation */}
			<div className="border-b border-gray-200">
				<nav className="-mb-px flex space-x-8">
					<button
						onClick={() => setActiveTab('create')}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'create'
								? 'border-orange-500 text-orange-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						<Settings className="inline-block w-4 h-4 mr-2" />
						Szybkie powiadomienie
					</button>
					<button
						onClick={() => setActiveTab('schedules')}
						className={`py-2 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'schedules'
								? 'border-orange-500 text-orange-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						<Calendar className="inline-block w-4 h-4 mr-2" />
						Harmonogramy powiadomień
					</button>
				</nav>
			</div>

			{/* Tab Content */}
			{activeTab === 'create' && (
				<div className="space-y-8">
					{/* Existing notifications configuration */}
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

							<div className="flex gap-3">
								<Button onClick={testNotification} variant="outline" className="flex-1">
									Podgląd z danymi testowymi
								</Button>
							</div>

							{testResult && (
								<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
									<h4 className="font-medium text-blue-900 mb-2">Wynik testu:</h4>
									<p className="text-blue-800 whitespace-pre-line">{testResult}</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{activeTab === 'schedules' && (
				<div className="space-y-6">
					{/* Schedules Header */}
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-900">Harmonogramy powiadomień</h2>
						<Button 
							onClick={() => {
								resetScheduleForm();
								setEditingSchedule(null);
								setShowCreateModal(true);
							}}
							className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
						>
							<Plus className="h-4 w-4" />
							Nowy harmonogram
						</Button>
					</div>

					{/* Schedules List */}
					<div className="space-y-4">
						{schedules.length === 0 ? (
							<Card>
								<CardContent className="text-center py-8">
									<Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">Brak harmonogramów</h3>
									<p className="text-gray-500 mb-4">Nie masz jeszcze żadnych zaplanowanych powiadomień.</p>
									<Button 
										onClick={() => {
											resetScheduleForm();
											setEditingSchedule(null);
											setShowCreateModal(true);
										}}
										className="bg-orange-600 hover:bg-orange-700 text-white"
									>
										<Plus className="h-4 w-4 mr-2" />
										Utwórz pierwszy harmonogram
									</Button>
								</CardContent>
							</Card>
						) : (
							schedules.map((schedule) => (
								<Card key={schedule.id} className={`${!schedule.isEnabled ? 'opacity-60' : ''}`}>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="text-lg">{schedule.title}</CardTitle>
												<p className="text-sm text-gray-600 mt-1">
													Kurs: {schedule.course.title}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${
													schedule.isEnabled 
														? 'bg-green-100 text-green-800' 
														: 'bg-gray-100 text-gray-800'
												}`}>
													{schedule.isEnabled ? 'Aktywny' : 'Nieaktywny'}
												</span>
												<Button
													onClick={() => toggleSchedule(schedule.id, schedule.isEnabled)}
													variant="outline"
													size="sm"
													className="w-8 h-8 p-0"
												>
													{schedule.isEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
												</Button>
												<Button
													onClick={() => editSchedule(schedule)}
													variant="outline"
													size="sm"
													className="w-8 h-8 p-0"
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													onClick={() => deleteSchedule(schedule.id)}
													variant="outline"
													size="sm"
													className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div>
												<p className="text-sm text-gray-600">Treść:</p>
												<p className="text-sm">{schedule.message}</p>
											</div>
											<div className="flex items-center gap-4 text-sm text-gray-600">
												<div className="flex items-center gap-1">
													<Clock className="h-4 w-4" />
													{getCronDescription(schedule.cronExpression)}
												</div>
												{schedule.lastSentAt && (
													<div className="flex items-center gap-1">
														<History className="h-4 w-4" />
														Ostatnio: {new Date(schedule.lastSentAt).toLocaleDateString('pl-PL')}
													</div>
												)}
											</div>
											{schedule.sentLogs.length > 0 && (
												<div>
													<p className="text-sm text-gray-600 mb-2">Ostatnie wysyłki:</p>
													<div className="space-y-1">
														{schedule.sentLogs.slice(0, 3).map((log) => (
															<div key={log.id} className="flex items-center justify-between text-xs text-gray-500">
																<span>{log.recipientEmail}</span>
																<span className={`px-2 py-1 rounded ${
																	log.status === 'SENT' 
																		? 'bg-green-100 text-green-800' 
																		: 'bg-red-100 text-red-800'
																}`}>
																	{log.status}
																</span>
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>
				</div>
			)}

			{/* Create/Edit Schedule Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<h3 className="text-lg font-semibold mb-4">
								{editingSchedule ? 'Edytuj harmonogram' : 'Nowy harmonogram powiadomień'}
							</h3>
							
							<div className="space-y-4">
								{/* Course Selection */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Kurs *</label>
									<select
										value={scheduleForm.courseId}
										onChange={(e) => handleScheduleFormChange('courseId', e.target.value)}
										className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
										disabled={!!editingSchedule}
									>
										<option value="">Wybierz kurs</option>
										{courses.map((course) => (
											<option key={course.id} value={course.id}>
												{course.title}
											</option>
										))}
									</select>
								</div>

								{/* Title */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Tytuł *</label>
									<input
										type="text"
										value={scheduleForm.title}
										onChange={(e) => handleScheduleFormChange('title', e.target.value)}
										className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
										placeholder="np. Cotygodniowe przypomnienie o kursie"
									/>
								</div>

								{/* Notification Type */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Typ powiadomienia</label>
									<select
										value={scheduleForm.notificationType}
										onChange={(e) => handleScheduleFormChange('notificationType', e.target.value)}
										className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
									>
										{notificationTypes.map((type) => (
											<option key={type.key} value={type.key}>
												{type.label}
											</option>
										))}
									</select>
								</div>

								{/* Message */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Treść wiadomości *</label>
									<textarea
										value={scheduleForm.message}
										onChange={(e) => handleScheduleFormChange('message', e.target.value)}
										rows={4}
										className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
										placeholder="Użyj {{user}} i {{course}} dla personalizacji"
									/>
								</div>

								{/* Cron Schedule */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Harmonogram wysyłki</label>
									<select
										value={scheduleForm.cronPreset}
										onChange={(e) => handleCronPresetChange(e.target.value)}
										className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
									>
										{cronPresets.map((preset) => (
											<option key={preset.value} value={preset.value}>
												{preset.label}
											</option>
										))}
									</select>
									
									{scheduleForm.cronPreset === 'custom' && (
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Wyrażenie Cron (minuta godzina dzień miesiąc dzień_tygodnia)
											</label>
											<input
												type="text"
												value={scheduleForm.cronExpression}
												onChange={(e) => handleScheduleFormChange('cronExpression', e.target.value)}
												className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
												placeholder="np. 0 9 * * 1"
											/>
											<p className="text-xs text-gray-500 mt-1">
												Format: minuta (0-59) godzina (0-23) dzień (1-31) miesiąc (1-12) dzień tygodnia (0-6, 0=niedziela)
											</p>
										</div>
									)}
								</div>

								{/* Enable/Disable */}
								<div className="flex items-center">
									<input
										type="checkbox"
										id="scheduleEnabled"
										checked={scheduleForm.isEnabled}
										onChange={(e) => handleScheduleFormChange('isEnabled', e.target.checked)}
										className="mr-2 text-orange-600 focus:ring-orange-500"
									/>
									<label htmlFor="scheduleEnabled" className="text-sm font-medium text-gray-700">
										Włącz harmonogram
									</label>
								</div>
							</div>

							<div className="flex gap-3 mt-6">
								<Button
									onClick={editingSchedule ? updateSchedule : createSchedule}
									disabled={loading}
									className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
								>
									{loading ? 'Zapisywanie...' : (editingSchedule ? 'Zaktualizuj' : 'Utwórz harmonogram')}
								</Button>
								<Button
									onClick={() => {
										setShowCreateModal(false);
										setEditingSchedule(null);
										resetScheduleForm();
									}}
									variant="outline"
									className="flex-1"
								>
									Anuluj
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}