import type { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onCourseDeleted?: (courseId: unknown) => void;

    // Teacher/students table helpers
    handleContact?: (email: string) => void;
    toggleStudentSelection?: (email: string) => void;
    toggleAllStudents?: () => void;
    selectedStudents?: string[];
    totalStudents?: number;
  }
}
