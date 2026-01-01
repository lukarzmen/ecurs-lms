"use client"

import * as React from "react"

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, BookOpen } from "lucide-react"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onCourseDeleted?: (courseId: unknown) => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onCourseDeleted,
}: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

    const table = useReactTable({
        data,
        columns,
        meta: {
            onCourseDeleted,
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        onColumnFiltersChange: setColumnFilters,
    })


    return (
        <div className="space-y-6">
            {/* Search and Filter Section */}
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Wyszukaj kurs..."
                        value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                        onChange={(event) => {
                            table.getColumn("title")?.setFilterValue(event.target.value)
                        }}
                        className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors w-full"
                    />
                </div>
                <div className="text-sm text-gray-500">
                    Znaleziono {table.getFilteredRowModel().rows.length} z {data.length} kursów
                </div>
            </div>
            {/* Table Section */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-gray-50">
                                {headerGroup.headers.map((header, index) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={`${index === 1 ? "w-1/12 text-right" : ""} font-semibold text-gray-700`}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell, index) => (
                                        <TableCell
                                            key={cell.id}
                                            className={`${index === 1 ? "w-1/12 text-right" : ""} py-4`}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <BookOpen className="h-12 w-12 text-gray-300" />
                                        <div>
                                            <p className="text-gray-500 font-medium">Brak kursów</p>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Utwórz swój pierwszy kurs, aby rozpocząć nauczanie
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
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
    )
}
