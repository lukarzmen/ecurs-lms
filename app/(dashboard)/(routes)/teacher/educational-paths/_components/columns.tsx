"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface EducationalPath {
  id: number;
  title: string;
  description: string | null;
  state: number;
  createdAt: string;
}

function PathActionsCell({
  path,
  onPathDeleted,
}: {
  path: EducationalPath;
  onPathDeleted?: (pathId: unknown) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirmDelete = async () => {
    const deleted = await handleDelete(path.id);
    setIsModalOpen(false);
    if (deleted) {
      onPathDeleted?.(path.id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Link href={`/teacher/educational-paths/${path.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 text-left">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Usuń ścieżkę edukacyjną</h3>
            <p className="text-sm text-gray-600 mb-5">
              Czy na pewno chcesz usunąć ścieżkę{" "}
              <span className="font-medium text-gray-900">&bdquo;{path.title}&rdquo;</span>?
              {" "}Ta operacja jest nieodwracalna.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(false);
                }}
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                size="sm"
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

const handleDelete = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/educational-paths/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      toast.success("Ścieżka edukacyjna została usunięta");
      return true;
    } else {
      toast.error("Nie udało się usunąć ścieżki edukacyjnej");
      return false;
    }
  } catch (error) {
    toast.error("Wystąpił błąd podczas usuwania ścieżki");
    return false;
  }
};

export const columns: ColumnDef<EducationalPath>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 font-semibold text-gray-700"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nazwa ścieżki
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const { id, title } = row.original;
      return (
        <Link
          href={`/teacher/educational-paths/${id}`}
          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          {title}
        </Link>
      );
    },
  },
  {
    accessorKey: "state",
    header: "Status",
    cell: ({ row }) => {
      const state = row.original.state;
      return state === 1 ? (
        <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100 font-medium shadow-none">
          Opublikowana
        </Badge>
      ) : (
        <Badge variant="outline" className="text-gray-500 border-gray-300 font-medium">
          Szkic
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 font-semibold text-gray-700"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Data utworzenia
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-sm text-gray-500">
          {date.toLocaleDateString("pl-PL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      return (
        <PathActionsCell
          path={row.original}
          onPathDeleted={table.options.meta?.onPathDeleted}
        />
      );
    },
  },
];
