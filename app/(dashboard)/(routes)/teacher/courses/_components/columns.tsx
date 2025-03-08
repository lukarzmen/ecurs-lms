"use client"

import { Button } from "@/components/ui/button"
import { Course } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

const handleDelete = async (id: string) => {
  try {
    const response = await fetch(`/api/courses/${id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      toast.success("Course deleted successfully");
      // Optionally, you can add code here to refresh the table or remove the deleted row from the UI
    } else {
      toast.error("Failed to delete course");
    }
  } catch (error) {
    toast.error("An error occurred while deleting the course");
  }
};

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
            <Button variant="ghost" className="h-4 w-8 p-0" onClick={async () => {
            await handleDelete(id.toString());
            window.location.reload();
            }}>
            <Trash2 className="h-4 w-4" />
            </Button>
        </>
      );
    }
  }
]
