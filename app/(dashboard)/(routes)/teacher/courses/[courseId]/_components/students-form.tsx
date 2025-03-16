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

interface StudentsFormProps {
    courseId: string;
}

interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    roleName: string;
}

export const StudentsForm = ({ courseId }: StudentsFormProps) => {
    const [students, setStudents] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/api/courses/${courseId}/users`);
                setStudents(response.data);
                setIsLoading(false);
            } catch (error: any) {
                setError(
                    error.message || "Wystąpił błąd podczas pobierania studentów."
                );
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, [courseId]);

    if (isLoading) {
        return <div>Ładowanie studentów...</div>;
    }

    if (error) {
        return <div>Błąd: {error}</div>;
    }

    return (
        <div className="mt-6 border bg-indigo-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Studenci
            </div>
            <div className="mt-4">
                <Table>
                    <TableCaption>Lista studentów zapisanych na kurs.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imię</TableHead>
                            <TableHead>Nazwisko</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rola</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.firstName}</TableCell>
                                <TableCell className="font-medium">{student.lastName}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>{student.roleName}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
