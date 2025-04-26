"use client";
import { useState, useEffect } from "react";
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
import { UserResponse } from "@/app/api/user/route";
import { UserCourseResponse } from "@/app/api/courses/[courseId]/users/route";
import { useAuth } from "@clerk/nextjs";
import { PlusCircle } from "lucide-react";

interface StudentsFormProps {
    courseId: string;
}

const activeState = 1;
const deactivatedState = 0;
export const StudentsForm = ({ courseId }: StudentsFormProps) => {
    const [students, setStudents] = useState<UserCourseResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userId } = useAuth();
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
    }, [courseId]);

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

    if (isLoading) {
        return <div>Ładowanie studentów...</div>;
    }

    return (
        <div className="mt-6 border bg-orange-100 rounded-md p-4 select-none">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Uczniowie</h2>
                <Button variant="ghost" size="sm" className="bg-orange-100 hover:bg-slate-100">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Zaproś
                </Button>
            </div>
            <div className="mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imię i nazwisko</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rola</TableHead>
                            <TableHead>Uprawnienia</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student: UserCourseResponse) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>{student.roleName}</TableCell>
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
