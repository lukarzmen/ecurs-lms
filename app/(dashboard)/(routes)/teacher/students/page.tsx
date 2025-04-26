'use client';

import { UserResponse } from '@/app/api/user/route';
import { authorizeUser } from '@/hooks/use-auth';
import { useAuth } from '@clerk/nextjs';
import { User } from '@prisma/client';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';


const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<User[]>([]);
    const { userId, sessionId } = useAuth(); // Assuming you have a way to get the current user's ID
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [message, setMessage] = useState('');
    const [author, setAuthor] = useState('');
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoading(true); // Start loading
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student?userId=${userId}`);
                const data = await response.json();
                setStudents(data);
            } catch (error) {
                console.error('Błąd podczas pobierania studentów:', error);
                toast.error('Nie udało się pobrać listy studentów.'); // Inform user about the error
            } finally {
                setIsLoading(false); // Stop loading regardless of outcome
            }
        };

        if (userId) {
            fetchStudents();
        } else {
            setIsLoading(false); // Stop loading if no userId
        }


    if (userId && sessionId) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(sessionId)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }).then((res) => res.json())
        .then((result: UserResponse) => {
            setAuthor(result.displayName);

        }).catch((error) => {
           console.error('Error fetching user data:', error);
        });
    }
    }
    ,[userId, sessionId]);

    const handleContact = (email: string) => {
        setSelectedEmail(email);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setMessage('');
    };

    const sendMessage = () => {
        // Here you would implement the logic to send the email
        console.log('Wysyłanie wiadomości:', message, 'do', selectedEmail);
        fetch('https://ecurs.app.n8n.cloud/webhook/439187fc-4dda-45ab-a78c-f014e6f1c8fc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: selectedEmail, message, author: author }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to send message');
                }
                return response.json();
            })
            .then((data) => {
                toast.success('Wysłano wiadomość pomyślnie!');
            })
            .catch((error) => {
                console.error('Error fetching user data:', error);
                toast.error('Nie udało się wysłać wiadomości. Spróbuj ponownie później.');
            });
        closeModal();
        // You can add your email sending logic here, for example using an API call
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p>Ładowanie studentów...</p>
                {/* You can replace this with a spinner component */}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 mt-4">Twoi kursanci</h1>
            <div className="bg-white shadow-md rounded-lg overflow-hidden select-none">
                <table className="min-w-full bg-white">
                    <thead>
                        <tr className="bg-orange-200">
                            <th className="py-2 px-4 text-center">Id</th>
                            <th className="py-2 px-4 text-center">Imię</th>
                            <th className="py-2 px-4 text-center">Nazwisko</th>
                            <th className="py-2 px-4 text-center">Email</th>
                            <th className="py-2 px-4 text-center">Akcja</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length > 0 ? (
                            students.map((student: User) => (
                                <tr key={student.id} className="border-t">
                                    <td className="py-2 px-4 text-center">{student.id}</td>
                                    <td className="py-2 px-4 text-center">{student.firstName || '-'}</td>
                                    <td className="py-2 px-4 text-center">{student.lastName || '-'}</td>
                                    <td className="py-2 px-4 text-center">{student.email}</td>
                                    <td className="py-2 px-4 text-center">
                                        <button
                                            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-700"
                                            onClick={() => handleContact(student.email)} // Assuming you have a function to handle contact
                                            >
                                            Napisz wiadomość
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-4">Brak studentów do wyświetlenia.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Skontaktuj się ze studentem</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Napisz wiadomość do <span className="font-semibold">{selectedEmail}</span>:
                                </p>
                                <textarea
                                    className="mt-4 w-full border rounded-md p-2"
                                    rows={4}
                                    placeholder="Twoja wiadomość tutaj"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    className="px-4 py-2 bg-orange-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                                    onClick={sendMessage}>
                                    Wyślij wiadomość
                                </button>
                                <button
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 mt-2"
                                    onClick={closeModal}
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsPage;