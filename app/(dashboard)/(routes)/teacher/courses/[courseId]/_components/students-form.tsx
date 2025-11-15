"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { UserCourseResponse } from "@/app/api/courses/[courseId]/users/route";
import { useAuth } from "@clerk/nextjs";
import { Loader2, PlusCircle, Users } from "lucide-react";
import { FormCard, FormSection } from "@/components/ui/form-card";

interface StudentsFormProps {
    courseId: string;
}

const activeState = 1;
const deactivatedState = 0;

export const StudentsForm = ({ courseId }: StudentsFormProps) => {
    const [students, setStudents] = useState<UserCourseResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userId } = useAuth();
    const [showInvite, setShowInvite] = useState(false);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [isInviting, setIsInviting] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/api/courses/${courseId}/users?userId=${userId}`);
                setStudents(response.data);
                setIsLoading(false);
            } catch (error: any) {
                toast.error(
                    error.message || "Wystąpił błąd podczas pobierania studentów."
                );
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, [courseId, userId]);

    // Debounced search
    useEffect(() => {
        if (search.trim().split(" ").join("").length < 3) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await axios.get(`/api/student/search?q=${encodeURIComponent(search)}`, {
                    headers: {
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                    },
                });
                setSearchResults(res.data);
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);
    }, [search]);

    const handleStateChange = async (userCourseId: number, state: number) => {
        try {
            await axios.patch(`/api/permissions/${userCourseId}`, { state: state });
            setStudents(
                students.map((student) =>
                    student.userCourseId === userCourseId ? { ...student, state: state } : student
                )
            );
            toast.success(state === 1 ? "Student został aktywowany." : "Student został deaktywowany.");
        } catch (error) {
            console.error("Error updating student state:", error);
            toast.error("Error updating student state");
        }
    };

    const handleSelectUser = (user: any) => {
        setSelectedUsers(prev =>
            prev.some(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        );
    };

    const handleInviteConfirm = async () => {
        if (selectedUsers.length === 0) return;
        setIsInviting(true);
        try {
            const res = await axios.post(`/api/courses/${courseId}/users`, {
                userIds: selectedUsers.map(u => u.id),
            });
            toast.success(`Dodano ${selectedUsers.length} użytkowników`);
            setShowInvite(false);
            setSearch("");
            setSearchResults([]);
            setSelectedUsers([]);
            // Optionally refresh students list
            const response = await axios.get(`/api/courses/${courseId}/users?userId=${userId}`);
            setStudents(response.data);
        } catch (error) {
            toast.error("Nie udało się dodać użytkowników");
        } finally {
            setIsInviting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-orange-700" />
            </div>
        );
    }

    return (
        <>
            <div className="mt-6">
                <FormCard
                    title="Uczniowie"
                    icon={Users}
                    status={{
                        label: students.length > 0 ? `${students.length} uczniów` : "Brak uczniów",
                        variant: students.length > 0 ? "default" : "outline",
                        className: students.length > 0 ? "bg-green-500" : ""
                    }}
                    isLoading={isLoading}
                    loadingMessage="Ładowanie listy uczniów..."
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">Zarządzanie uczestnikami kursu</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowInvite(true)}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Zaproś
                        </Button>
                    </div>
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Imię i nazwisko</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rola</TableHead>
                                    <TableHead>Postęp</TableHead>
                                    <TableHead>Uprawnienia</TableHead>
                                    <TableHead>Czy opłacony?</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.length > 0 ? students.map((student: UserCourseResponse) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell>{student.roleName}</TableCell>
                                        <TableCell>{`${(student.progress * 100.0).toFixed(2)}%`}</TableCell>
                                        <TableCell>
                                            {student.roleId === 0 && (
                                                student.state === 0 ? (
                                                    <Button className="w-[90px]" onClick={() => handleStateChange(student.userCourseId, activeState)}>
                                                        Aktywuj
                                                    </Button>
                                                ) : (
                                                    <Button className="bg-blue-300 w-[90px]" onClick={() => handleStateChange(student.userCourseId, deactivatedState)}>
                                                        Deaktywuj
                                                    </Button>
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell>TAK</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <FormSection variant="warning">
                                                <p>
                                                    <strong>Brak uczniów w kursie</strong><br />
                                                    Zaproś pierwszych uczestników
                                                </p>
                                            </FormSection>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </FormCard>
            </div>
            
            {showInvite && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-background border rounded-lg shadow-lg p-6 min-w-[320px]">
                        <div className="mb-4">
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary"
                                placeholder="Wpisz imię, nazwisko lub email"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {isSearching && (
                            <div className="flex justify-center py-2">
                                <Loader2 className="animate-spin" />
                            </div>
                        )}
                        {!isSearching && searchResults.length > 0 && (
                            <ul className="max-h-48 overflow-y-auto">
                                {searchResults.map(user => (
                                    <li key={user.id} className="flex items-center py-2 border-b last:border-b-0 hover:bg-muted transition">
                                        <input
                                            type="checkbox"
                                            className="mr-2"
                                            checked={selectedUsers.some(u => u.id === user.id)}
                                            onChange={() => handleSelectUser(user)}
                                        />
                                        <span>
                                            {user.firstName} {user.lastName} ({user.email})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!isSearching && search && searchResults.length === 0 && (
                            <div className="text-sm text-muted-foreground">Brak wyników.</div>
                        )}
                        <div className="flex justify-end mt-4 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowInvite(false);
                                    setSelectedUsers([]);
                                }}
                            >
                                Zamknij
                            </Button>
                            <Button
                                disabled={selectedUsers.length === 0 || isInviting}
                                onClick={handleInviteConfirm}
                            >
                                {isInviting ? <Loader2 className="animate-spin" size={20} /> : "Dodaj wybranych"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentsForm;
