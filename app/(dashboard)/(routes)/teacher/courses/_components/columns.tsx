"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Course } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const handleDelete = async (id: string) => {
  try {
    const response = await fetch(`/api/courses/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      toast.success("Kurs został pomyślnie usunięty");
      // Optionally, refresh the UI or remove the row
    } else {
      toast.error("Nie udało się usunąć kursu");
    }
  } catch (error) {
    toast.error("Wystąpił błąd podczas usuwania kursu");
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
  },
  {
    id: "actions",
    header: "Wykonaj",
    cell: ({ row }) => {
      const { id } = row.original;
      const [isModalOpen, setIsModalOpen] = useState(false);

      const handleConfirmDelete = async () => {
        await handleDelete(id.toString());
        setIsModalOpen(false);
        window.location.reload();
      };

      return (
        <>
          <Link href={`/teacher/courses/${id}`}>
            <Button variant="ghost" className="h-4 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="h-4 w-8 p-0"
            onClick={() => setIsModalOpen(true)}
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
                    onClick={() => setIsModalOpen(false)}
                  >
                    Anuluj
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDelete}
                  >
                    Usuń
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    },
  },
];
