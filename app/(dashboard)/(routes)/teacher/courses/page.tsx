import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { StripeStatusBanner } from "./_components/stripe-status-banner";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-gray-600" />
            <span>Twoje kursy</span>
            <span className="text-sm md:text-lg font-normal text-gray-500 bg-gray-100 px-2 py-1 md:px-3 rounded-full">
              {courses.length}
            </span>
          </h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj swoimi kursami i śledź postępy studentów
          </p>
        </div>
        <Link href="/teacher/courses/create" className="w-full md:w-auto">
          <Button size="lg" className="w-full md:w-auto">
            <Plus className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Utwórz nowy kurs</span>
            <span className="sm:hidden">Nowy kurs</span>
          </Button>
        </Link>
      </div>

      {/* Stripe Status Banner */}
      <StripeStatusBanner />

      {/* Courses Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Lista kursów</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={courses} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CoursesPage;
