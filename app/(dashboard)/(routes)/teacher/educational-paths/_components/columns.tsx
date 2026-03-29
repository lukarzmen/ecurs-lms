"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";

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
  const { t } = useI18n();

  const handleConfirmDelete = async () => {
    const deleted = await handleDelete(path.id, t);
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
            <h3 className="text-base font-semibold text-gray-900 mb-1">{t("epCols.deleteTitle")}</h3>
            <p className="text-sm text-gray-600 mb-5">
              {t("epCols.deleteConfirm").replace("{title}", path.title)}
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
                {t("epCols.cancel")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmDelete();
                }}
              >
                {t("epCols.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const handleDelete = async (id: number, t: (key: string) => string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/educational-paths/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      toast.success(t("epCols.deleted"));
      return true;
    } else {
      toast.error(t("epCols.deleteError"));
      return false;
    }
  } catch (error) {
    toast.error(t("epCols.deleteException"));
    return false;
  }
};

export const getColumns = (t: (key: string) => string): ColumnDef<EducationalPath>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 font-semibold text-gray-700"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {t("epCols.pathName")}
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
          {t("epCols.published")}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-gray-500 border-gray-300 font-medium">
          {t("epCols.draft")}
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
        {t("epCols.createdAt")}
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
