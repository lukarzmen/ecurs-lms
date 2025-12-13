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
	isEnabled: boolean;
	createdAt: string;
	updatedAt: string;
	schoolId: number;
	notificationType: string;
	cronExpression: string;
	school?: {
		id: number;
		name: string;
	};
}

export default function NotificationsPage() {
	const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
	const [loading, setLoading] = useState(false);
	const [userSchool, setUserSchool] = useState<{ id: number; name: string } | null>(null);
	const [userSchools, setUserSchools] = useState<{ id: number; name: string }[]>([]);
	
	// Form state
	const [templateForm, setTemplateForm] = useState({
		title: '',
		message: '',
		category: 'general',
		schoolId: '',
		cronExpression: '0 9 * * 1', // Default: Every Monday at 9 AM
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
		fetchSchoolAndTemplates();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchSchoolAndTemplates = async () => {
		try {
			setLoading(true);
			
			// Fetch user's schools
			const schoolsRes = await fetch('/api/user/school');
			if (schoolsRes.ok) {
				const data = await schoolsRes.json();
				console.log('Schools fetched:', data);
				
				// Combine owned and member schools
				const allSchools = [
					...(data.ownedSchools || []),
					...(data.memberSchools || [])
				];
				
				setUserSchools(allSchools);
				if (allSchools.length > 0) {
					setUserSchool(allSchools[0]);
					setTemplateForm(prev => ({
						...prev,
						schoolId: allSchools[0].id.toString(),
					}));
				} else {
					console.warn('No schools returned from API');
				}
			} else {
				const errorText = await schoolsRes.text();
				console.error('Failed to fetch schools:', schoolsRes.status, errorText);
				toast.error('Nie udało się pobrać danych szkoły');
			}
			
			// Fetch templates
			await fetchTemplates();
		} catch (error) {
			console.error('Error in fetchSchoolAndTemplates:', error);
			toast.error('Błąd podczas pobierania danych');
		} finally {
			setLoading(false);
		}
	};

	const fetchCourses = async () => {
		if (!userId) return;
		
		try {
			const response = await fetch(`/api/courses?userId=${userId}`);
			if (response.ok) {
				const coursesData = await response.json();
				console.log('Courses fetched:', coursesData);
			} else {
				console.error('Failed to fetch courses');
			}
		} catch (error) {
			console.error('Error fetching courses:', error);
		}
	};

	const fetchTemplates = async () => {
		try {
			setLoading(true);
			
			// Fetch actual schedules from API
			const response = await fetch('/api/notifications/schedules');
			let apiTemplates: NotificationTemplate[] = [];
			
			if (response.ok) {
				const schedules = await response.json();
				// Convert NotificationSchedule to NotificationTemplate format
				apiTemplates = schedules.map((schedule: any) => ({
					id: schedule.id,
					title: schedule.title,
					message: schedule.message,
					category: schedule.notificationType,
					isEnabled: schedule.isEnabled,
					createdAt: schedule.createdAt,
					updatedAt: schedule.updatedAt,
					schoolId: schedule.schoolId,
					notificationType: schedule.notificationType,
					cronExpression: schedule.cronExpression,
					school: schedule.school
				}));
			}

			// Add predefined templates as examples (not saved to DB unless user creates them)
			const exampleTemplates: NotificationTemplate[] = defaultTemplates.map((template, index) => ({
				id: -(index + 1), // Negative IDs for examples
				...template,
				isEnabled: false, // Examples are disabled by default
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				schoolId: 0, // No specific school for examples
				notificationType: template.category,
				cronExpression: '0 9 * * 1', // Default cron
			}));

			// Combine API templates with examples (API templates first)
			setTemplates([...apiTemplates, ...exampleTemplates]);
		} catch (error) {
			console.error('Error fetching templates:', error);
			toast.error('Błąd podczas ładowania szablonów');
		} finally {
			setLoading(false);
		}
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
			schoolId: userSchool?.id.toString() || '',
			cronExpression: '0 9 * * 1', // Default: Every Monday at 9 AM
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
			schoolId: template.schoolId.toString(),
			cronExpression: template.cronExpression,
		});
		setShowCreateModal(true);
	};

	const saveTemplate = async () => {
		if (!templateForm.title || !templateForm.message) {
			toast.error('Wypełnij tytuł i treść szablonu');
			return;
		}

		if (!editingTemplate && !templateForm.schoolId) {
			toast.error('Wybierz szkołę dla nowego szablonu');
			return;
		}

		setLoading(true);
		try {
			if (editingTemplate) {
				// Update existing template (only if it's a real template, not an example)
				if (editingTemplate.id < 0) {
					toast.error('Nie można edytować szablonu przykładowego. Utwórz nowy szablon.');
					return;
				}

				const response = await fetch(`/api/notifications/schedules/${editingTemplate.id}`, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						title: templateForm.title,
						message: templateForm.message,
						notificationType: templateForm.category,
						cronExpression: templateForm.cronExpression,
					}),
				});

				if (response.ok) {
					const updatedSchedule = await response.json();
					setTemplates(prev => prev.map(t => 
						t.id === editingTemplate.id 
							? {
								...t,
								title: updatedSchedule.title,
								message: updatedSchedule.message,
								category: updatedSchedule.notificationType,
								notificationType: updatedSchedule.notificationType,
								cronExpression: updatedSchedule.cronExpression,
								updatedAt: updatedSchedule.updatedAt
							}
							: t
					));
					toast.success('Szablon został zaktualizowany');
				} else {
					toast.error('Błąd podczas aktualizacji szablonu');
				}
			} else {
				// Create new template
				const response = await fetch('/api/notifications/schedules', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						schoolId: parseInt(templateForm.schoolId),
						title: templateForm.title,
						message: templateForm.message,
						notificationType: templateForm.category,
						cronExpression: templateForm.cronExpression,
						isEnabled: true,
					}),
				});

				if (response.ok) {
					const newSchedule = await response.json();
					const newTemplate: NotificationTemplate = {
						id: newSchedule.id,
						title: newSchedule.title,
						message: newSchedule.message,
						category: newSchedule.notificationType,
						isEnabled: newSchedule.isEnabled,
						createdAt: newSchedule.createdAt,
						updatedAt: newSchedule.updatedAt,
						schoolId: newSchedule.schoolId,
						notificationType: newSchedule.notificationType,
						cronExpression: newSchedule.cronExpression,
						school: newSchedule.school
					};
					setTemplates(prev => [newTemplate, ...prev]);
					toast.success('Szablon został utworzony');
				} else {
					const errorData = await response.json();
					toast.error(`Błąd podczas tworzenia szablonu: ${errorData.message || 'Nieznany błąd'}`);
				}
			}
			
			setShowCreateModal(false);
			resetTemplateForm();
		} catch (error) {
			console.error('Error saving template:', error);
			toast.error('Błąd zapisywania szablonu');
		} finally {
			setLoading(false);
		}
	};

	const deleteTemplate = async (id: number) => {
		if (id < 0) {
			toast.error('Nie można usunąć szablonu przykładowego');
			return;
		}

		if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;

		try {
			const response = await fetch(`/api/notifications/schedules/${id}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				setTemplates(prev => prev.filter(t => t.id !== id));
				toast.success('Szablon został usunięty');
			} else {
				toast.error('Błąd podczas usuwania szablonu');
			}
		} catch (error) {
			console.error('Error deleting template:', error);
			toast.error('Błąd podczas usuwania szablonu');
		}
	};

	const toggleTemplate = async (id: number) => {
		if (id < 0) {
			toast.error('Nie można włączać/wyłączać szablonów przykładowych. Utwórz nowy szablon na ich podstawie.');
			return;
		}

		try {
			const template = templates.find(t => t.id === id);
			if (!template) return;

			const response = await fetch(`/api/notifications/schedules/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					isEnabled: !template.isEnabled,
				}),
			});

			if (response.ok) {
				const updatedSchedule = await response.json();
				setTemplates(prev => prev.map(t => 
					t.id === id ? { ...t, isEnabled: !t.isEnabled, updatedAt: updatedSchedule.updatedAt } : t
				));
				toast.success('Status szablonu został zmieniony');
			} else {
				toast.error('Błąd podczas zmiany statusu szablonu');
			}
		} catch (error) {
			console.error('Error toggling template:', error);
			toast.error('Błąd podczas zmiany statusu szablonu');
		}
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

	const createTemplateFromExample = (template: NotificationTemplate) => {
		if (!userSchool) {
			toast.error('Nie udało się pobrać danych szkoły');
			return;
		}
		setEditingTemplate(null);
		setTemplateForm({
			title: template.title,
			message: template.message,
			category: template.category,
			schoolId: userSchool.id.toString(),
			cronExpression: '0 9 * * 1', // Default cron
		});
		setShowCreateModal(true);
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
								<Card key={template.id} className={`${!template.isEnabled ? 'opacity-60' : ''}`}>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<CardTitle className="text-lg">{template.title}</CardTitle>
												{template.id < 0 && (
													<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														Przykład
													</span>
												)}
											</div>
											<div className="flex items-center gap-2">
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${
													template.isEnabled 
														? 'bg-green-100 text-green-800' 
														: template.id < 0 
															? 'bg-gray-100 text-gray-600'
															: 'bg-gray-100 text-gray-800'
												}`}>
													{template.id < 0 ? 'Szablon' : (template.isEnabled ? 'Aktywny' : 'Nieaktywny')}
												</span>
												{template.school && (
													<span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
														{template.school.name}
													</span>
												)}
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
												
												{/* Different buttons for example templates vs real templates */}
												{template.id < 0 ? (
													// Example template buttons
													<Button
														onClick={() => createTemplateFromExample(template)}
														size="sm"
														variant="outline"
														className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
													>
														<Plus className="h-3 w-3" />
														Użyj jako nowy
													</Button>
												) : (
													// Real template buttons
													<>
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
																template.isEnabled ? 'text-yellow-600' : 'text-green-600'
															}`}
														>
															{template.isEnabled ? '⏸️' : '▶️'}
															{template.isEnabled ? 'Dezaktywuj' : 'Aktywuj'}
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
													</>
												)}
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

								{/* School selection - only show for new templates */}
								{!editingTemplate && userSchools.length > 0 && (
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Szkoła *</label>
										<select
											value={templateForm.schoolId}
											onChange={(e) => handleTemplateFormChange('schoolId', e.target.value)}
											className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
										>
											<option value="">Wybierz szkołę...</option>
											{userSchools.map((school) => (
												<option key={school.id} value={school.id.toString()}>
													{school.name}
												</option>
											))}
										</select>
									</div>
								)}

								{/* Cron expression - only show for new templates or when editing */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Harmonogram (Cron) 
										<span className="text-gray-500 text-xs ml-1">opcjonalne</span>
									</label>
									<Input
										type="text"
										value={templateForm.cronExpression}
										onChange={(e) => handleTemplateFormChange('cronExpression', e.target.value)}
										placeholder="np. 0 9 * * 1 (każdy poniedziałek o 9:00)"
									/>
									<p className="text-xs text-gray-500 mt-1">
										Format: minuta godzina dzień miesiąc dzień_tygodnia
									</p>
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