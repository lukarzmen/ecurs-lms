"use client"

import { Button } from "@/components/ui/button"
import { Course } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { id } = row.original;
      return (
        <>
          <Link href={`/teacher/courses/${id}`}>
              <Button variant="ghost" className="h-4 w-8 p-0">
              <Pencil className="h-4 w-4" />
              </Button>
          </Link>
          <Button variant="ghost" className="h-4 w-8 p-0" onClick={() => {toast.error("Not implemented")}}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      );
    }
  }
]
