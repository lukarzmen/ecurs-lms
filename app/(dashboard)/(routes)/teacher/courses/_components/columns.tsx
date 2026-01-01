"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Course } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Trash2 } from "lucide-react"; // Removed Pencil
import Link from "next/link";
import toast from "react-hot-toast";

function CourseActionsCell({
  course,
  onCourseDeleted,
}: {
  course: Course;
  onCourseDeleted?: (courseId: unknown) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirmDelete = async () => {
    const deleted = await handleDelete(course.id.toString());
    setIsModalOpen(false);
    if (deleted) {
      onCourseDeleted?.(course.id);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        className="h-4 w-8 p-0"
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <div>Czy na pewno chcesz usunąć ten kurs?</div>
            <div className="flex justify-end mt-4">
              <Button
                variant="secondary"
                className="mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(false);
                }}
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmDelete();
                }}
              >
                Usuń
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const handleDelete = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/courses/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      toast.success("Kurs został pomyślnie usunięty");
      return true;
    } else {
      toast.error("Nie udało się usunąć kursu");
      return false;
    }
  } catch (error) {
    toast.error("Wystąpił błąd podczas usuwania kursu");
    return false;
  }
};

export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nazwa
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    // Make the title cell clickable for editing
    cell: ({ row }) => {
      const { id, title } = row.original;
      return (
        <Link
          href={`/teacher/courses/${id}`}
          className="cursor-pointer hover:underline"
        >
          {title}
        </Link>
      );
    },
  },
  {
    id: "actions",
    header: "Wykonaj",
    cell: ({ row, table }) => {
      return (
        <CourseActionsCell
          course={row.original}
          onCourseDeleted={table.options.meta?.onCourseDeleted}
        />
      );
    },
  },
];
