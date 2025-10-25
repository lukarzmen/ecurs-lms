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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span>Twoje kursy</span>
            <span className="text-lg font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {courses.length}
            </span>
          </h1>
          <p className="text-gray-600 mt-2">
            Zarządzaj swoimi kursami i śledź postępy studentów
          </p>
        </div>
        <Link href="/teacher/courses/create">
          <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-5 w-5 mr-2" />
            Utwórz nowy kurs
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
