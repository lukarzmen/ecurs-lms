"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { UserResponse } from "@/app/api/user/route";
import { Bell, Mail, Plus, Edit, Trash2, Send, Copy, Eye, Sparkles, TestTube } from "lucide-react";

interface NotificationTemplate {
	id: number;
	title: string;
	message: string;
	category: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export default function NotificationsPage() {
	const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
	const [loading, setLoading] = useState(false);
	
	// Form state
	const [templateForm, setTemplateForm] = useState({
		title: '',
		message: '',
		category: 'general',
	});

	// Test state
	const [testUser, setTestUser] = useState('Jan Kowalski');
	const [testCourse, setTestCourse] = useState('JavaScript dla początkujących');
	const [testResult, setTestResult] = useState('');
	const [showTestResult, setShowTestResult] = useState(false);

	const { userId, sessionId } = useAuth();

	// Template categories
	const categories = [
		{ key: 'general', label: 'Ogólne' },
		{ key: 'course', label: 'Kursowe' },
		{ key: 'reminder', label: 'Przypomnienia' },
		{ key: 'payment', label: 'Płatności' }
	];

	// Default templates
	const defaultTemplates = [
		{
			title: "Nowa lekcja dostępna",
			message: "Cześć {{user}}! 🎉 W Twoim kursie '{{course}}' pojawiła się nowa lekcja. Sprawdź ją już teraz i kontynuuj swoją edukacyjną podróż!",
			category: "course"
		},
		{
			title: "Przypomnienie o kursie",
			message: "{{user}}, nie zauważyliśmy Twojej aktywności w kursie '{{course}}' przez pewien czas. Wróć do nauki i osiągnij swoje cele! 💪",
			category: "reminder"
		},
		{
			title: "Nowy kurs w ścieżce",
			message: "Hej {{user}}! Właśnie dodaliśmy nowy kurs '{{course}}' do Twojej ścieżki edukacyjnej. Odkryj nowe możliwości rozwoju już dziś! 🚀",
			category: "course"
		},
		{
			title: "Przypomnienie o płatności",
			message: "{{user}}, nie odnotowaliśmy płatności za kurs '{{course}}'. Sprawdź szczegóły i dokończ transakcję, aby kontynuować naukę. 💳",
			category: "payment"
		}
	];

	// Fetch templates on component mount
	useEffect(() => {
		fetchTemplates();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchTemplates = async () => {
		// Simulate API call - replace with actual API
		setTemplates(defaultTemplates.map((template, index) => ({
			id: index + 1,
			...template,
			isActive: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		})));
	};

	const handleTemplateFormChange = (field: string, value: string) => {
		setTemplateForm(prev => ({
			...prev,
			[field]: value
		}));
	};

	const resetTemplateForm = () => {
		setTemplateForm({
			title: '',
			message: '',
			category: 'general',
		});
	};

	const openCreateModal = () => {
		resetTemplateForm();
		setEditingTemplate(null);
		setShowCreateModal(true);
	};

	const openEditModal = (template: NotificationTemplate) => {
		setEditingTemplate(template);
		setTemplateForm({
			title: template.title,
			message: template.message,
			category: template.category,
		});
		setShowCreateModal(true);
	};

	const saveTemplate = async () => {
		if (!templateForm.title || !templateForm.message) {
			toast.error('Wypełnij tytuł i treść szablonu');
			return;
		}

		setLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			if (editingTemplate) {
				// Update existing template
				setTemplates(prev => prev.map(t => 
					t.id === editingTemplate.id 
						? { ...t, ...templateForm, updatedAt: new Date().toISOString() }
						: t
				));
				toast.success('Szablon został zaktualizowany');
			} else {
				// Create new template
				const newTemplate: NotificationTemplate = {
					id: Math.max(...templates.map(t => t.id), 0) + 1,
					...templateForm,
					isActive: true,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
				setTemplates(prev => [...prev, newTemplate]);
				toast.success('Szablon został utworzony');
			}
			
			setShowCreateModal(false);
			resetTemplateForm();
		} catch (error) {
			toast.error('Błąd zapisywania szablonu');
		} finally {
			setLoading(false);
		}
	};

	const deleteTemplate = async (id: number) => {
		if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;

		setTemplates(prev => prev.filter(t => t.id !== id));
		toast.success('Szablon został usunięty');
	};

	const toggleTemplate = async (id: number) => {
		setTemplates(prev => prev.map(t => 
			t.id === id ? { ...t, isActive: !t.isActive } : t
		));
		toast.success('Status szablonu został zmieniony');
	};

	const testTemplate = (message: string) => {
		if (!testUser || !testCourse) {
			toast.error('Podaj nazwę użytkownika i kursu do testu');
			return;
		}
		
		const result = message
			.replace(/\{\{user\}\}/g, testUser)
			.replace(/\{\{course\}\}/g, testCourse);
		
		setTestResult(result);
		setShowTestResult(true);
	};

	const copyTemplate = (message: string) => {
		navigator.clipboard.writeText(message);
		toast.success('Szablon skopiowany do schowka');
	};

	const sendTestEmail = async (message: string) => {
		if (!testUser || !testCourse) {
			toast.error('Podaj nazwę użytkownika i kursu do testu');
			return;
		}

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

			const testMessage = message
				.replace(/\{\{user\}\}/g, testUser)
				.replace(/\{\{course\}\}/g, testCourse);

			const res = await fetch("/api/notifications/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					to: email,
					subject: "Test powiadomienia z ecurs",
					text: testMessage,
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

	const generateTemplateContent = async () => {
		if (!templateForm.title) {
			toast.error('Podaj tytuł szablonu przed generowaniem');
			return;
		}

		setLoading(true);
		try {
			const prompt = `Napisz profesjonalne powiadomienie email dla platformy edukacyjnej o tytule "${templateForm.title}". Użyj zmiennych {{user}} i {{course}} w treści. Powiadomienie powinno być przyjazne, motywujące i nie dłuższe niż 4 zdania. Dodaj odpowiednie emoji.`;
			
			const res = await fetch("/api/tasks", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					systemPrompt: "Jesteś asystentem LMS. Tworzysz przyjazne, profesjonalne powiadomienia dla użytkowników. Używaj zmiennych {{user}} i {{course}} w treści.",
					userPrompt: prompt,
				}),
			});
			
			if (!res.ok) throw new Error("API error");
			const data = await res.text();
			
			setTemplateForm(prev => ({
				...prev,
				message: data || ""
			}));
			
			toast.success("Treść szablonu została wygenerowana");
		} catch (err) {
			console.error("Error generating template:", err);
			toast.error("Błąd generowania treści");
		} finally {
			setLoading(false);
		}
	};

	const getTemplatesByCategory = (category: string) => {
		return templates.filter(t => t.category === category);
	};

	return (
		<div className="p-6 space-y-8">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
						<Bell className="h-8 w-8 text-orange-600" />
						<span>Szablony powiadomień</span>
					</h1>
					<p className="text-gray-600 mt-2">
						Zarządzaj szablonami powiadomień i testuj je przed wysyłką
					</p>
				</div>
				<Button 
					onClick={openCreateModal}
					className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					Nowy szablon
				</Button>
			</div>

			{/* Test Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<TestTube className="h-5 w-5 text-orange-600" />
						<span>Dane testowe</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Nazwa użytkownika</label>
							<Input
								type="text"
								placeholder="np. Jan Kowalski"
								value={testUser}
								onChange={(e) => setTestUser(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Nazwa kursu</label>
							<Input
								type="text"
								placeholder="np. JavaScript dla początkujących"
								value={testCourse}
								onChange={(e) => setTestCourse(e.target.value)}
							/>
						</div>
					</div>
					<div className="mt-4 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
						<p className="font-medium text-blue-800 mb-1">Zmienne szablonu:</p>
						<p>
							Użyj <code className="bg-white px-1 py-0.5 rounded text-xs font-mono">{"{{user}}"}</code> i{" "}
							<code className="bg-white px-1 py-0.5 rounded text-xs font-mono">{"{{course}}"}</code> w treści szablonów. Zostaną zastąpione danymi testowymi powyżej.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Templates by Categories */}
			{categories.map((category) => {
				const categoryTemplates = getTemplatesByCategory(category.key);
				if (categoryTemplates.length === 0) return null;

				return (
					<div key={category.key}>
						<h2 className="text-xl font-semibold text-gray-900 mb-4">{category.label}</h2>
						<div className="space-y-4">
							{categoryTemplates.map((template) => (
								<Card key={template.id} className={`${!template.isActive ? 'opacity-60' : ''}`}>
									<CardHeader>
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg">{template.title}</CardTitle>
											<div className="flex items-center gap-2">
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${
													template.isActive 
														? 'bg-green-100 text-green-800' 
														: 'bg-gray-100 text-gray-800'
												}`}>
													{template.isActive ? 'Aktywny' : 'Nieaktywny'}
												</span>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="bg-gray-50 rounded-lg p-3">
												<p className="text-sm text-gray-800 whitespace-pre-line">{template.message}</p>
											</div>
											
											<div className="flex flex-wrap gap-2">
												<Button
													onClick={() => testTemplate(template.message)}
													size="sm"
													variant="outline"
													className="flex items-center gap-1"
												>
													<Eye className="h-3 w-3" />
													Podgląd
												</Button>
												<Button
													onClick={() => copyTemplate(template.message)}
													size="sm"
													variant="outline"
													className="flex items-center gap-1"
												>
													<Copy className="h-3 w-3" />
													Kopiuj
												</Button>
												<Button
													onClick={() => sendTestEmail(template.message)}
													size="sm"
													variant="outline"
													className="flex items-center gap-1 text-orange-600 border-orange-600 hover:bg-orange-50"
													disabled={loading}
												>
													<Send className="h-3 w-3" />
													Testuj email
												</Button>
												<Button
													onClick={() => openEditModal(template)}
													size="sm"
													variant="outline"
													className="flex items-center gap-1"
												>
													<Edit className="h-3 w-3" />
													Edytuj
												</Button>
												<Button
													onClick={() => toggleTemplate(template.id)}
													size="sm"
													variant="outline"
													className={`flex items-center gap-1 ${
														template.isActive ? 'text-yellow-600' : 'text-green-600'
													}`}
												>
													{template.isActive ? '⏸️' : '▶️'}
													{template.isActive ? 'Dezaktywuj' : 'Aktywuj'}
												</Button>
												<Button
													onClick={() => deleteTemplate(template.id)}
													size="sm"
													variant="outline"
													className="flex items-center gap-1 text-red-600 hover:text-red-700"
												>
													<Trash2 className="h-3 w-3" />
													Usuń
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				);
			})}

			{templates.length === 0 && (
				<Card>
					<CardContent className="text-center py-12">
						<Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">Brak szablonów</h3>
						<p className="text-gray-500 mb-4">Nie masz jeszcze żadnych szablonów powiadomień.</p>
						<Button 
							onClick={openCreateModal}
							className="bg-orange-600 hover:bg-orange-700 text-white"
						>
							<Plus className="h-4 w-4 mr-2" />
							Utwórz pierwszy szablon
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Create/Edit Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<h3 className="text-lg font-semibold mb-4">
								{editingTemplate ? 'Edytuj szablon' : 'Nowy szablon powiadomienia'}
							</h3>
							
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Tytuł szablonu *</label>
									<Input
										type="text"
										value={templateForm.title}
										onChange={(e) => handleTemplateFormChange('title', e.target.value)}
										placeholder="np. Przypomnienie o nowej lekcji"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Kategoria</label>
									<select
										value={templateForm.category}
										onChange={(e) => handleTemplateFormChange('category', e.target.value)}
										className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
									>
										{categories.map((category) => (
											<option key={category.key} value={category.key}>
												{category.label}
											</option>
										))}
									</select>
								</div>

								<div>
									<div className="flex items-center justify-between mb-2">
										<label className="block text-sm font-medium text-gray-700">Treść wiadomości *</label>
										<Button
											onClick={generateTemplateContent}
											size="sm"
											variant="outline"
											className="flex items-center gap-1 text-orange-600 border-orange-600 hover:bg-orange-50"
											disabled={loading}
										>
											<Sparkles className="h-3 w-3" />
											{loading ? 'Generowanie...' : 'Wygeneruj AI'}
										</Button>
									</div>
									<textarea
										value={templateForm.message}
										onChange={(e) => handleTemplateFormChange('message', e.target.value)}
										rows={5}
										className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
										placeholder="Użyj {{user}} i {{course}} dla personalizacji..."
									/>
								</div>

								{/* Quick test in modal */}
								{templateForm.message && testUser && testCourse && (
									<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
										<p className="text-sm font-medium text-gray-700 mb-2">Podgląd z danymi testowymi:</p>
										<p className="text-sm text-gray-800 whitespace-pre-line">
											{templateForm.message
												.replace(/\{\{user\}\}/g, testUser)
												.replace(/\{\{course\}\}/g, testCourse)
											}
										</p>
									</div>
								)}
							</div>

							<div className="flex gap-3 mt-6">
								<Button
									onClick={saveTemplate}
									disabled={loading}
									className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
								>
									{loading ? 'Zapisywanie...' : (editingTemplate ? 'Zaktualizuj szablon' : 'Utwórz szablon')}
								</Button>
								<Button
									onClick={() => {
										setShowCreateModal(false);
										setEditingTemplate(null);
										resetTemplateForm();
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

			{/* Test Result Modal */}
			{showTestResult && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-lg w-full">
						<div className="p-6">
							<h3 className="text-lg font-semibold mb-4">Podgląd powiadomienia</h3>
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<p className="text-sm text-blue-800 whitespace-pre-line">{testResult}</p>
							</div>
							<div className="flex gap-3 mt-6">
								<Button
									onClick={() => sendTestEmail(testResult)}
									className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
									disabled={loading}
								>
									<Send className="h-4 w-4 mr-2" />
									{loading ? 'Wysyłanie...' : 'Wyślij testowy email'}
								</Button>
								<Button
									onClick={() => setShowTestResult(false)}
									variant="outline"
									className="flex-1"
								>
									Zamknij
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}