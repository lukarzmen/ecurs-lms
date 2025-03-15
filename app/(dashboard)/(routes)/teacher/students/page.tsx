import { db } from '@/lib/db';
import { User } from '@prisma/client';
import React from 'react';

const StudentsPage: React.FC = async () => {
    const strudentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student`);
    const students = await strudentsResponse.json();
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Uczniowie</h1>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 bg-gray-200 text-left">Id</th>
                            <th className="py-2 px-4 bg-gray-200 text-left">Imię</th>
                            <th className="py-2 px-4 bg-gray-200 text-left">Nazwisko</th>
                            <th className="py-2 px-4 bg-gray-200 text-left">Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student: User) => (
                            <tr key={student.id} className="border-t">
                                <td className="py-2 px-4">{student.id}</td>
                                <td className="py-2 px-4">{student.firstName}</td>
                                <td className="py-2 px-4">{student.lastName}</td>
                                <td className="py-2 px-4">{student.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentsPage;