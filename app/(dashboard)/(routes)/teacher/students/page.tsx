'use client';

import { UserResponse } from '@/app/api/user/route';
import { useAuth } from '@clerk/nextjs';
import { User } from '@prisma/client';
import { Loader2, Mail, Users, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-1 rounded shadow font-semibold transition"
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
                <Loader2 className="animate-spin text-orange-600 h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="h-8 w-8 text-orange-600" />
                        <span>Twoi kursanci</span>
                        <span className="text-lg font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {students.length}
                        </span>
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Zarządzaj swoimi studentami i utrzymuj z nimi kontakt
                    </p>
                </div>
            </div>

            {/* Students Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Lista kursantów</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Search Section */}
                        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Wyszukaj kursanta..."
                                    value={(table.getColumn("firstName")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) => {
                                        table.getColumn("firstName")?.setFilterValue(event.target.value)
                                    }}
                                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors w-full"
                                />
                            </div>
                            <div className="text-sm text-gray-500">
                                Znaleziono {table.getFilteredRowModel().rows.length} z {students.length} kursantów
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-[600px] w-full">
                                    <thead className="bg-gray-50">
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header, index) => (
                                                    <th
                                                        key={header.id}
                                                        className={`py-3 px-4 text-left font-semibold text-gray-700 text-sm ${columns[index]?.meta?.style || ""}`}
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
                                    <tbody className="divide-y divide-gray-200">
                                        {table.getRowModel().rows?.length ? (
                                            table.getRowModel().rows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    data-state={row.getIsSelected() && "selected"}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    {row.getVisibleCells().map((cell, index) => (
                                                        <td
                                                            key={cell.id}
                                                            className={`py-4 px-4 text-sm ${columns[index]?.meta?.style || ""}`}
                                                        >
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={columns.length} className="h-32 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                        <Users className="h-12 w-12 text-gray-300" />
                                                        <div>
                                                            <p className="text-gray-500 font-medium">Brak kursantów</p>
                                                            <p className="text-gray-400 text-sm mt-1">
                                                                Gdy studenci zapiszą się na Twoje kursy, pojawią się tutaj
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination Section */}
                        {table.getPageCount() > 1 && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Strona {table.getState().pagination.pageIndex + 1} z {table.getPageCount()}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="hover:bg-gray-50"
                                    >
                                        Poprzednia
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        className="hover:bg-gray-50"
                                    >
                                        Następna
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative w-full max-w-md mx-auto p-6 border shadow-xl rounded-lg bg-white">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Skontaktuj się ze studentem</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Napisz wiadomość do <span className="font-semibold text-orange-600">{selectedEmail}</span>:
                            </p>
                            <textarea
                                className="mt-2 w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                rows={4}
                                placeholder="Twoja wiadomość tutaj..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white font-semibold rounded-md shadow hover:bg-orange-700 transition-colors"
                                    onClick={sendMessage}
                                >
                                    Wyślij wiadomość
                                </button>
                                <button
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow hover:bg-gray-300 transition-colors"
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