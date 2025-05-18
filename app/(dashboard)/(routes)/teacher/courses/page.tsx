import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const CoursesPage = async () => {
  const { userId } = auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  let fetchError: string | null = null;
  let courses = [];

  try {
    const coursesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/courses?userId=${userId}`,
      { next: { revalidate: 60 } }
    );
    if (!coursesResponse.ok) {
      const errorData = await coursesResponse.json().catch(() => ({ error: `HTTP error! status: ${coursesResponse.status}` }));
      fetchError = errorData.error || `HTTP error! status: ${coursesResponse.status}`;
      console.error("Error fetching courses:", fetchError);
    } else {
      courses = await coursesResponse.json();
    }
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "An unknown error occurred during fetch.";
    console.error("Failed to fetch or parse courses:", error);
  }

  if (fetchError) {
    redirect("/error");
  }

  return (
    <div className="p-6">
      <DataTable columns={columns} data={courses} />
    </div>
  );
};

export default CoursesPage;
