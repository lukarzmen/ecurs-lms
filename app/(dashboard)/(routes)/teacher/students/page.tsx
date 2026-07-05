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
import { useI18n } from '@/hooks/use-i18n';

import type { SortingState, ColumnFiltersState } from "@tanstack/react-table";
const createColumns = (t: (key: string) => string) => [
    {
        header: (row: any) => (
            <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer"
                checked={row.table.options.meta?.selectedStudents?.length === row.table.options.meta?.totalStudents}
                onChange={() => row.table.options.meta?.toggleAllStudents()}
            />
        ),
        id: "select",
        cell: (row: any) => (
            <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer"
                checked={row.table.options.meta?.selectedStudents?.includes(row.row.original.email)}
                onChange={() => row.table.options.meta?.toggleStudentSelection(row.row.original.email)}
            />
        ),
        size: 50,
        meta: { style: "w-12" },
    },
    {
        header: t("teacherStudents.table.userId"),
        accessorKey: "id",
        cell: (row: any) => <span className="font-mono">{row.getValue()}</span>,
        // Even less width for ID (3 chars)
        size: 40,
        meta: { style: "w-12" }, // much less width
    },
    {
        header: t("teacherStudents.table.firstName"),
        accessorKey: "firstName",
        cell: (row: any) => row.getValue() || "-",
        size: 160,
        meta: { style: "w-40" },
    },
    {
        header: t("teacherStudents.table.lastName"),
        accessorKey: "lastName",
        cell: (row: any) => row.getValue() || "-",
        size: 160,
        meta: { style: "w-40" },
    },
    {
        header: t("teacherStudents.table.email"),
        accessorKey: "email",
        cell: (row: any) => (
            <span className="inline-flex items-center gap-1">
                <span>{row.getValue()}</span>
                <button
                    className="ml-2 text-orange-600 hover:text-orange-800 transition"
                    title={t("teacherStudents.table.sendMessage")}
                    onClick={() => row.table.options.meta?.handleContact(row.getValue())}
                >
                    <Mail size={18} />
                </button>
            </span>
        ),
        meta: { style: "w-56" },
    },
    {
        header: t("teacherStudents.table.joined"),
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
                    <span className="text-xs text-gray-500 ml-1">{t("teacherStudents.table.days").replace("{days}", String(diffDays))}</span>
                </span>
            );
        },
        meta: { style: "w-40" },
    },
    {
        header: t("teacherStudents.table.action"),
        id: "action",
        cell: (row: any) => (
            <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-1 rounded shadow font-semibold transition"
                onClick={() => row.table.options.meta?.handleContact(row.row.original.email)}
            >
                {t("teacherStudents.table.write")}
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
    const { t } = useI18n();
    const columns = createColumns(t);
    const [students, setStudents] = useState<User[]>([]);
    const { userId, sessionId } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [message, setMessage] = useState('');
    const [author, setAuthor] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkMessage, setBulkMessage] = useState('');
    const [isSendingBulk, setIsSendingBulk] = useState(false);
    const [schoolId, setSchoolId] = useState<number | null>(null);

    useEffect(() => {
        const fetchDataSequentially = async () => {
            setIsLoading(true);
            try {
                if (!userId) {
                    setIsLoading(false);
                    return;
                }

                // First fetch school ID
                const schoolResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/schools/current`,
                    { cache: "no-store" }
                );
                
                if (!schoolResponse.ok) {
                    throw new Error("Failed to fetch school");
                }

                const schoolData = await schoolResponse.json();
                setSchoolId(schoolData.id);

                // Then fetch school students
                const studentsResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/schools/${schoolData.id}/students`,
                    { cache: "no-store" }
                );

                if (!studentsResponse.ok) {
                    throw new Error("Failed to fetch students");
                }

                const studentsData = await studentsResponse.json();
                setStudents(studentsData);
            } catch (error) {
                console.error('Error fetching students:', error);
                toast.error(t('teacherStudents.toast.fetchError'));
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchDataSequentially();
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
    }, [userId, sessionId, t]);

    const handleContact = (email: string) => {
        setSelectedEmail(email);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setMessage('');
    };

    const toggleStudentSelection = (email: string) => {
        setSelectedStudents(prev => 
            prev.includes(email) 
                ? prev.filter(e => e !== email)
                : [...prev, email]
        );
    };

    const toggleAllStudents = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.email));
        }
    };

    const openBulkModal = () => {
        if (selectedStudents.length === 0) {
            toast.error(t('teacherStudents.toast.selectOne'));
            return;
        }
        setIsBulkModalOpen(true);
    };

    const closeBulkModal = () => {
        setIsBulkModalOpen(false);
        setBulkMessage('');
    };

    const sendBulkMessage = async () => {
        if (!bulkMessage.trim()) {
            toast.error(t('teacherStudents.toast.enterMessage'));
            return;
        }

        setIsSendingBulk(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const email of selectedStudents) {
                try {
                    const response = await fetch('/api/notifications/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: email,
                            subject: t('teacherStudents.message.subject').replace('{author}', author),
                            text: `${t('teacherStudents.message.from').replace('{author}', author)}\n\n${bulkMessage}`,
                            useSSL: true
                        }),
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    failCount++;
                    console.error(`Failed to send to ${email}:`, error);
                }
            }

            if (successCount > 0) {
                toast.success(t('teacherStudents.toast.bulkSent').replace('{count}', String(successCount)));
            }
            if (failCount > 0) {
                toast.error(t('teacherStudents.toast.bulkFailed').replace('{count}', String(failCount)));
            }
            
            closeBulkModal();
            setSelectedStudents([]);
        } catch (error) {
            console.error('Error sending bulk messages:', error);
            toast.error(t('teacherStudents.toast.sendError'));
        } finally {
            setIsSendingBulk(false);
        }
    };

    const generateBulkAIMessage = async (type: 'motivation' | 'reminder' | 'feedback') => {
        setIsGenerating(true);
        try {
            const prompts = {
                motivation: {
                    systemPrompt: t('teacherStudents.aiPrompt.bulk.motivation.system'),
                    userPrompt: t('teacherStudents.aiPrompt.bulk.motivation.user').replace('{count}', String(selectedStudents.length))
                },
                reminder: {
                    systemPrompt: t('teacherStudents.aiPrompt.bulk.reminder.system'),
                    userPrompt: t('teacherStudents.aiPrompt.bulk.reminder.user').replace('{count}', String(selectedStudents.length))
                },
                feedback: {
                    systemPrompt: t('teacherStudents.aiPrompt.bulk.feedback.system'),
                    userPrompt: t('teacherStudents.aiPrompt.bulk.feedback.user').replace('{count}', String(selectedStudents.length))
                }
            };

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prompts[type]),
            });

            if (!response.ok) {
                throw new Error('Failed to generate message');
            }

            const generatedMessage = await response.text();
            setBulkMessage(generatedMessage);
            toast.success(t('teacherStudents.toast.aiGenerated'));
        } catch (error) {
            console.error('Error generating AI message:', error);
            toast.error(t('teacherStudents.toast.aiGenerateError'));
        } finally {
            setIsGenerating(false);
        }
    };

    const generateAIMessage = async (type: 'motivation' | 'reminder' | 'feedback') => {
        setIsGenerating(true);
        try {
            const prompts = {
                motivation: {
                    systemPrompt: t('teacherStudents.aiPrompt.single.motivation.system'),
                    userPrompt: t('teacherStudents.aiPrompt.single.motivation.user').replace('{email}', selectedEmail)
                },
                reminder: {
                    systemPrompt: t('teacherStudents.aiPrompt.single.reminder.system'),
                    userPrompt: t('teacherStudents.aiPrompt.single.reminder.user').replace('{email}', selectedEmail)
                },
                feedback: {
                    systemPrompt: t('teacherStudents.aiPrompt.single.feedback.system'),
                    userPrompt: t('teacherStudents.aiPrompt.single.feedback.user').replace('{email}', selectedEmail)
                }
            };

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prompts[type]),
            });

            if (!response.ok) {
                throw new Error('Failed to generate message');
            }

            const generatedMessage = await response.text();
            setMessage(generatedMessage);
            toast.success(t('teacherStudents.toast.aiGenerated'));
        } catch (error) {
            console.error('Error generating AI message:', error);
            toast.error(t('teacherStudents.toast.aiGenerateError'));
        } finally {
            setIsGenerating(false);
        }
    };

    const sendMessage = async () => {
        if (!message.trim()) {
            toast.error(t('teacherStudents.toast.enterMessage'));
            return;
        }

        setIsSending(true);
        try {
            const response = await fetch('/api/notifications/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: selectedEmail,
                    subject: t('teacherStudents.message.subject').replace('{author}', author),
                    text: `${t('teacherStudents.message.from').replace('{author}', author)}\n\n${message}`,
                    useSSL: true
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send message');
            }

            toast.success(t('teacherStudents.toast.sent'));
            closeModal();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(t('teacherStudents.toast.sendLaterError'));
        } finally {
            setIsSending(false);
        }
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
        meta: { 
            handleContact, 
            toggleStudentSelection,
            toggleAllStudents,
            selectedStudents,
            totalStudents: students.length
        },
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
                        <span>{t('teacherStudents.title')}</span>
                        <span className="text-lg font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {students.length}
                        </span>
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {t('teacherStudents.subtitle')}
                    </p>
                </div>
                {selectedStudents.length > 0 && (
                    <Button
                        onClick={openBulkModal}
                        className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                    >
                        <Mail className="h-4 w-4" />
                        {t('teacherStudents.sendSelected').replace('{count}', String(selectedStudents.length))}
                    </Button>
                )}
            </div>

            {/* Students Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>{t('teacherStudents.listTitle')}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Search Section */}
                        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder={t('teacherStudents.searchPlaceholder')}
                                    value={(table.getColumn("firstName")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) => {
                                        table.getColumn("firstName")?.setFilterValue(event.target.value)
                                    }}
                                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors w-full"
                                />
                            </div>
                            <div className="text-sm text-gray-500">
                                {t('teacherStudents.found').replace('{filtered}', String(table.getFilteredRowModel().rows.length)).replace('{total}', String(students.length))}
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
                                                            <p className="text-gray-500 font-medium">{t('teacherStudents.emptyTitle')}</p>
                                                            <p className="text-gray-400 text-sm mt-1">
                                                                {t('teacherStudents.emptyDescription')}
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
                                    {t('teacherStudents.pagination').replace('{current}', String(table.getState().pagination.pageIndex + 1)).replace('{total}', String(table.getPageCount()))}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="hover:bg-gray-50"
                                    >
                                        {t('teacherStudents.previous')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        className="hover:bg-gray-50"
                                    >
                                        {t('teacherStudents.next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Send Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative w-full max-w-md mx-auto p-6 border shadow-xl rounded-lg bg-white">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('teacherStudents.bulkModal.title')}</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {t('teacherStudents.bulkModal.sendingTo').replace('{count}', String(selectedStudents.length))}
                            </p>
                            
                            {/* AI Buttons */}
                            <div className="mb-4 flex flex-wrap gap-2 justify-center">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generateBulkAIMessage('motivation')}
                                    disabled={isGenerating}
                                    className="text-xs"
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : '✨'} {t('teacherStudents.ai.motivation')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generateBulkAIMessage('reminder')}
                                    disabled={isGenerating}
                                    className="text-xs"
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : '🔔'} {t('teacherStudents.ai.reminder')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generateBulkAIMessage('feedback')}
                                    disabled={isGenerating}
                                    className="text-xs"
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : '💬'} {t('teacherStudents.ai.feedback')}
                                </Button>
                            </div>

                            <textarea
                                className="mt-2 w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                rows={4}
                                placeholder={t('teacherStudents.messagePlaceholder')}
                                value={bulkMessage}
                                onChange={(e) => setBulkMessage(e.target.value)}
                                disabled={isGenerating}
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white font-semibold rounded-md shadow hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    onClick={sendBulkMessage}
                                    disabled={isSendingBulk || !bulkMessage.trim()}
                                >
                                    {isSendingBulk && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isSendingBulk ? t('teacherStudents.sending') : t('teacherStudents.sendAll')}
                                </button>
                                <button
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow hover:bg-gray-300 transition-colors"
                                    onClick={closeBulkModal}
                                    disabled={isSendingBulk}
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative w-full max-w-md mx-auto p-6 border shadow-xl rounded-lg bg-white">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('teacherStudents.singleModal.title')}</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {t('teacherStudents.singleModal.to').replace('{email}', selectedEmail)}
                            </p>
                            
                            {/* AI Buttons */}
                            <div className="mb-4 flex flex-wrap gap-2 justify-center">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generateAIMessage('motivation')}
                                    disabled={isGenerating}
                                    className="text-xs"
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : '✨'} {t('teacherStudents.ai.motivation')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generateAIMessage('reminder')}
                                    disabled={isGenerating}
                                    className="text-xs"
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : '🔔'} {t('teacherStudents.ai.reminder')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generateAIMessage('feedback')}
                                    disabled={isGenerating}
                                    className="text-xs"
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : '💬'} {t('teacherStudents.ai.feedback')}
                                </Button>
                            </div>

                            <textarea
                                className="mt-2 w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                rows={4}
                                placeholder={t('teacherStudents.messagePlaceholder')}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={isGenerating}
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white font-semibold rounded-md shadow hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    onClick={sendMessage}
                                    disabled={isSending || !message.trim()}
                                >
                                    {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isSending ? t('teacherStudents.sending') : t('teacherStudents.sendMessage')}
                                </button>
                                <button
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow hover:bg-gray-300 transition-colors"
                                    onClick={closeModal}
                                >
                                    {t('common.cancel')}
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