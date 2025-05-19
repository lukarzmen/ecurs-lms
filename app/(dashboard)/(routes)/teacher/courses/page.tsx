import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const CoursesPage = async () => {

  const {userId} = auth();
  if(!userId) {
    return redirect("/sign-in");
  }

  const coursesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses?userId=${userId}`
    , { next: { revalidate: 60 } });
  const courses = await coursesResponse.json();

  return (
      <div className="p-6">
        <DataTable columns={columns} data={courses} />
      </div>
  );
};

export default CoursesPage;
