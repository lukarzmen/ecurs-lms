"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface StudentsFormProps {
    courseId: string;
}

interface User {
    id: number;
    userCourseId: number;
    firstName: string;
    lastName: string;
    email: string;
    roleName: string;
    state: number;
}

export const StudentsForm = ({ courseId }: StudentsFormProps) => {
    const [students, setStudents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/api/courses/${courseId}/users`);
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

    const handleActivate = async (userCourseId: number) => {
        try {
            await axios.patch(`/api/permissions/${userCourseId}`);

            setStudents(
                students.map((student) =>
                    student.userCourseId === userCourseId ? { ...student, state: 1 } : student
                )
            );
            toast.success("Student został aktywowany.");
        } catch (error) {
            console.error("Error updating student state:", error);
            toast.error("Error updating student state");
        }
    };

    if (isLoading) {
        return <div>Ładowanie studentów...</div>;
    }

    return (
        <div className="mt-6 border bg-indigo-100 rounded-md p-4">
            <div className="mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imię</TableHead>
                            <TableHead>Nazwisko</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rola</TableHead>
                            <TableHead>Uprawnienia</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.firstName}</TableCell>
                                <TableCell className="font-medium">{student.lastName}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>{student.roleName}</TableCell>
                                <TableCell>
                                    {student.state === 0 ? (
                                        <Button onClick={() => handleActivate(student.userCourseId)}>
                                            Aktywuj
                                        </Button>
                                    ) : (
                                        "Zapisany"
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
