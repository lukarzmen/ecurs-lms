import { auth } from "@clerk/nextjs/server";
import { CheckCircle, Clock, Home as HomeIcon, BookOpen, GraduationCap } from "lucide-react";
import { InfoCard } from "./_components/info-card";
import { redirect } from "next/navigation";
import { authorizeUser } from "@/hooks/use-auth";
import { DashboardCoursesResponse, CourseDetails } from "@/app/api/user/courses/route"; // Import CourseDetails
import { EnrolledEduList } from "@/components/ui/enrolled-list";
import { EnrolledEduList as EnrolledEduPathList } from "@/components/ui/enrolled-list";
import { SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  let educationalPaths: any[] = [];
  let eduPathFinishedCount = 0;
  let eduPathUnfinishedCount = 0;
  const { userId, sessionId } = await auth();
  if (!userId) {
    return (
      <SignedOut>
        <div className="p-6">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Ecurs — platforma nowoczesnej edukacji</h1>
            <p className="text-gray-600">
              Zaloguj się lub załóż konto, aby zobaczyć panel, swoje kursy oraz postępy nauki.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/sign-in">Zaloguj się</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-up">Załóż konto</Link>
              </Button>
            </div>
          </div>
        </div>
      </SignedOut>
    );
  }
  const authState = await authorizeUser(userId, sessionId);
  console.debug('Authorization state:', authState);
  if (authState.authState === 'userNotExists') {
    return redirect("/register");
  }

  // Initialize with default values
  let courses: CourseDetails[] = [];
  let finishedCount = 0;
  let unfinishedCount = 0;
  let fetchError: string | null = null;

  try {
    // Fetch enrolled educational paths
    const eduPathRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/educational-paths?userId=${userId}`, { cache: 'no-store' });
    if (eduPathRes.ok) {
      const eduPathData = await eduPathRes.json();
      educationalPaths = eduPathData.educationalPaths || [];
      eduPathFinishedCount = eduPathData.finishedCount ?? 0;
      eduPathUnfinishedCount = eduPathData.unfinishedCount ?? 0;
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/courses?userId=${userId}`, { cache: 'no-store' }); // Added no-store cache option for dynamic data
    if (!response.ok) {
      // Handle HTTP errors (e.g., 400, 500)
      const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` })); // Attempt to parse error JSON, fallback to status
      fetchError = errorData.error || `HTTP error! status: ${response.status}`;
      console.error("Error fetching user courses:", fetchError);
    } else {
      const userCourses: DashboardCoursesResponse = await response.json();
      // Check if the API returned an error structure
      if ('error' in userCourses) {
        fetchError = userCourses.error;
        console.error("API returned error:", fetchError);
      } else {
        // Destructure only if it's the success structure
        ({ courses, finishedCount, unfinishedCount } = userCourses);
      }
    }
  } catch (error) {
    // Handle fetch/network errors or JSON parsing errors
    fetchError = error instanceof Error ? error.message : "An unknown error occurred during fetch.";
    console.error("Failed to fetch or parse user courses:", error);
  }
  // Optional: Display an error message to the user if fetchError is set
  if (fetchError) {
    // You might want to render a specific error component or message here
    // For now, we'll proceed with empty/default data but log the error server-side
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <HomeIcon className="h-8 w-8 text-orange-600" />
            <span>Panel główny</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Witaj ponownie! Śledź swoje postępy i kontynuuj naukę
          </p>
        </div>
      </div>

      {fetchError && ( // Conditionally render an error message
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200" role="alert">
          <span className="font-medium">Błąd!</span> Nie udało się załadować kursów: {fetchError}
        </div>
      )}
      
      {/* Progress Section */}
      <section>
        <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-orange-600" />
          Twoje postępy
        </h2>
        
        {/* Educational Paths statistics */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-orange-600" />
            Ścieżki edukacyjne
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard icon={Clock} label="Ścieżki w trakcie" numberOfItems={eduPathUnfinishedCount} variant="path" />
            <InfoCard icon={CheckCircle} label="Ścieżki ukończone" numberOfItems={eduPathFinishedCount} variant="path" />
          </div>
        </div>
        
        {/* Courses statistics */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-600" />
            Kursy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard icon={Clock} label="Kursy w trakcie" numberOfItems={unfinishedCount} variant="course" />
            <InfoCard icon={CheckCircle} label="Kursy ukończone" numberOfItems={finishedCount} variant="course" />
          </div>
        </div>
      </section>

      {/* Educational Paths Section */}
      <section>
        <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-orange-600" />
          Twoje ścieżki edukacyjne
        </h2>
        <EnrolledEduPathList items={educationalPaths} />
      </section>
      
      {/* Courses Section */}
      <section>
        <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-orange-600" />
          Twoje kursy
        </h2>
        <EnrolledEduList items={courses} />
      </section>
    </div>
  );
}
