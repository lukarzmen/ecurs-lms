import React from 'react';

interface Student {
    id: number;
    name: string;
    email: string;
}

const students: Student[] = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com' },
    { id: 3, name: 'Sam Johnson', email: 'sam.johnson@example.com' },
];

const StudentsPage: React.FC = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Students Enrolled in the Course</h1>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 bg-gray-200">ID</th>
                            <th className="py-2 px-4 bg-gray-200">Name</th>
                            <th className="py-2 px-4 bg-gray-200">Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => (
                            <tr key={student.id} className="border-t">
                                <td className="py-2 px-4">{student.id}</td>
                                <td className="py-2 px-4">{student.name}</td>
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