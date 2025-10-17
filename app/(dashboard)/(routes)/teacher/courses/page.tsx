import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { StripeStatusBanner } from "./_components/stripe-status-banner";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const CoursesPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  const coursesResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/courses?userId=${userId}`,
    {
      cache: "no-store", // This ensures fresh data on each request
    }
  );
  const courses = await coursesResponse.json();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 mt-6 flex items-center gap-2">
        <span>📚 Twoje kursy</span>
        <span className="text-base font-normal text-gray-400 ml-2">
          ({courses.length})
        </span>
      </h1>
      <StripeStatusBanner />
      <DataTable columns={columns} data={courses} />
    </div>
  );
};

export default CoursesPage;
