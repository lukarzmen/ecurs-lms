"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Course } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";

function CourseActionsCell({
  course,
  onCourseDeleted,
}: {
  course: Course;
  onCourseDeleted?: (courseId: unknown) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useI18n();

  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success(t('teacherCourses.deleteSuccess'));
        return true;
      } else {
        toast.error(t('teacherCourses.deleteError'));
        return false;
      }
    } catch (error) {
      toast.error(t('teacherCourses.deleteException'));
      return false;
    }
  };

  const handleConfirmDelete = async () => {
    const deleted = await handleDelete(course.id.toString());
    setIsModalOpen(false);
    if (deleted) {
      onCourseDeleted?.(course.id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Link href={`/teacher/courses/${course.id}`}>
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
            <h3 className="text-base font-semibold text-gray-900 mb-1">{t('teacherCourses.deleteCourse')}</h3>
            <p className="text-sm text-gray-600 mb-5">
              {t('teacherCourses.deleteConfirm').replace('{title}', course.title)}
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
                {t('teacherCourses.cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmDelete();
                }}
              >
                {t('teacherCourses.deleteCourse')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



export const getColumns = (t: (key: string) => string, locale: string): ColumnDef<Course>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 font-semibold text-gray-700"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {t('teacherCourses.courseName')}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const { id, title } = row.original;
      return (
        <Link
          href={`/teacher/courses/${id}`}
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
          {t('teacherCourses.published')}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-gray-500 border-gray-300 font-medium">
          {t('teacherCourses.draft')}
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
        {t('teacherCourses.createdAt')}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-sm text-gray-500">
          {date.toLocaleDateString(locale === 'en' ? 'en-US' : 'pl-PL', {
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
        <CourseActionsCell
          course={row.original}
          onCourseDeleted={table.options.meta?.onCourseDeleted}
        />
      );
    },
  },
];