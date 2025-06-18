'use client';

import { UserResponse } from '@/app/api/user/route';
import { useAuth } from '@clerk/nextjs';
import { User } from '@prisma/client';
import { Loader2, Mail } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { SortingState, ColumnFiltersState } from "@tanstack/react-table";
const columns = [
    {
        header: "Id użytkownika",
        accessorKey: "id",
        cell: (row: any) => <span className="font-mono">{row.getValue()}</span>,
        // Even less width for ID (3 chars)
        size: 40,
        meta: { style: "w-12" }, // much less width
    },
    {
        header: "Imię",
        accessorKey: "firstName",
        cell: (row: any) => row.getValue() || "-",
        size: 160,
        meta: { style: "w-40" },
    },
    {
        header: "Nazwisko",
        accessorKey: "lastName",
        cell: (row: any) => row.getValue() || "-",
        size: 160,
        meta: { style: "w-40" },
    },
    {
        header: "Email",
        accessorKey: "email",
        cell: (row: any) => (
            <span className="inline-flex items-center gap-1">
                <span>{row.getValue()}</span>
                <button
                    className="ml-2 text-orange-600 hover:text-orange-800 transition"
                    title="Wyślij wiadomość"
                    onClick={() => row.table.options.meta?.handleContact(row.getValue())}
                >
                    <Mail size={18} />
                </button>
            </span>
        ),
        meta: { style: "w-56" },
    },
    {
        header: "Dołączył",
        accessorKey: "createdAt",
        cell: (row: any) => {
            const createdAt = row.getValue() instanceof Date
                ? row.getValue()
                : new Date(row.getValue());
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - createdAt.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return (
                <span>
                    <span className="font-mono">{createdAt.toISOString().slice(0, 10)}</span>
                    <br />
                    <span className="text-xs text-gray-500 ml-1">({diffDays} dni)</span>
                </span>
            );
        },
        meta: { style: "w-40" },
    },
    {
        header: "Akcja",
        id: "action",
        cell: (row: any) => (
            <Button
            disabled={true}
                className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-1 rounded shadow font-semibold transition"
                onClick={() => row.table.options.meta?.handleContact(row.row.original.email)}
            >
                Napisz
            </Button>
        ),
        meta: { style: "w-32" },
    },
];

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<User[]>([]);
    const { userId, sessionId } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [message, setMessage] = useState('');
    const [author, setAuthor] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student?userId=${userId}`);
                const data = await response.json();
                setStudents(data);
            } catch (error) {
                console.error('Błąd podczas pobierania studentów:', error);
                toast.error('Nie udało się pobrać listy studentów.');
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchStudents();
        } else {
            setIsLoading(false);
        }

        if (userId && sessionId) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(sessionId)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
                .then((res) => res.json())
                .then((result: UserResponse) => setAuthor(result.displayName))
                .catch((error) => console.error('Error fetching user data:', error));
        }
    }, [userId, sessionId]);

    const handleContact = (email: string) => {
        setSelectedEmail(email);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setMessage('');
    };

    const sendMessage = () => {
        fetch('https://ecurs.app.n8n.cloud/webhook/439187fc-4dda-45ab-a78c-f014e6f1c8fc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: selectedEmail, message, author: author }),
        })
            .then((response) => {
                if (!response.ok) throw new Error('Failed to send message');
                return response.json();
            })
            .then(() => toast.success('Wysłano wiadomość pomyślnie!'))
            .catch(() => toast.error('Nie udało się wysłać wiadomości. Spróbuj ponownie później.'));
        closeModal();
    };


    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data: students,
        columns: columns as ColumnDef<User, any>[],
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: { sorting, columnFilters },
        onColumnFiltersChange: setColumnFilters,
        meta: { handleContact },
    });

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 text-center flex justify-center items-center h-screen">
                <Loader2 className="animate-spin text-orange-700" size={32} />
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 mt-4 sm:mt-6 flex items-center gap-2">
                <span>🎓 Twoi kursanci</span>
                <span className="text-base font-normal text-gray-400 ml-2">
                    ({students.length})
                </span>
            </h1>
            <div className="flex flex-col space-y-2 sm:space-y-4 py-2 sm:py-4 sm:flex-row sm:space-x-4 sm:justify-between select-none">
                <Input
                    placeholder="Wyszukaj..."
                    value={(table.getColumn("firstName")?.getFilterValue() as string) ?? ""}
                    onChange={(event) => {
                        table.getColumn("firstName")?.setFilterValue(event.target.value)
                    }}
                    className="max-w-full sm:max-w-sm"
                />
            </div>
            <div className="rounded-md border overflow-x-auto bg-white">
                <table className="min-w-[600px] w-full divide-y divide-orange-200">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header, index) => (
                                    <th
                                        key={header.id}
                                        className={`py-2 sm:py-3 px-2 sm:px-4 text-center font-semibold border-r border-orange-100 text-xs sm:text-base ${columns[index]?.meta?.style || ""}`}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-orange-50"
                                >
                                    {row.getVisibleCells().map((cell, index) => (
                                        <td
                                            key={cell.id}
                                            className={`py-2 sm:py-2 px-2 sm:px-4 text-center border-r border-orange-100 select-none text-xs sm:text-base ${columns[index]?.meta?.style || ""}`}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="h-24 text-center select-none">
                                    Brak wyników.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Poprzedni
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Następny
                </Button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative w-full max-w-md mx-auto p-4 sm:p-6 border shadow-xl rounded-lg bg-white">
                        <div className="text-center">
                            <h3 className="text-lg sm:text-xl font-bold text-orange-700 mb-2">Skontaktuj się ze studentem</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">
                                Napisz wiadomość do <span className="font-semibold">{selectedEmail}</span>:
                            </p>
                            <textarea
                                className="mt-2 w-full border rounded-md p-2 focus:ring-2 focus:ring-orange-300"
                                rows={4}
                                placeholder="Twoja wiadomość tutaj"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                <button
                                    className="flex-1 px-4 py-2 bg-orange-500 text-white font-semibold rounded-md shadow hover:bg-orange-700 transition"
                                    onClick={sendMessage}
                                >
                                    Wyślij wiadomość
                                </button>
                                <button
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow hover:bg-gray-300 transition"
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