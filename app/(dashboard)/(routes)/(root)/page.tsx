import { auth } from "@clerk/nextjs/server";
import { CheckCircle, Clock } from "lucide-react";
import { InfoCard } from "./_components/info-card";
import { redirect } from "next/navigation";
import { authorizeUser } from "@/hooks/use-auth";
import { DashboardCoursesResponse, CourseDetails } from "@/app/api/user/courses/route"; // Import CourseDetails
import { EnrolledEduList } from "@/components/ui/enrolled-list";
import { EnrolledEduList as EnrolledEduPathList } from "@/components/ui/enrolled-list";

export default async function Home() {
  let educationalPaths: any[] = [];
  let eduPathFinishedCount = 0;
  let eduPathUnfinishedCount = 0;
  const { userId, sessionId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }
  const authState = await authorizeUser(userId, sessionId);

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
    <div className="p-6 space-y-4">
      {fetchError && ( // Conditionally render an error message
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <span className="font-medium">Błąd!</span> Nie udało się załadować kursów: {fetchError}
        </div>
      )}
      <section>
        <h2 className="text-xl font-bold mb-4 text-green-700">Twoje postępy</h2>
        {/* Educational Paths statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <InfoCard icon={Clock} label="Ścieżki w trakcie" numberOfItems={eduPathUnfinishedCount} variant="path" />
          <InfoCard icon={CheckCircle} label="Ścieżki ukończone" numberOfItems={eduPathFinishedCount} variant="path" />
        </div>
        {/* Courses statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <InfoCard icon={Clock} label="Kursy w trakcie" numberOfItems={unfinishedCount} variant="course" />
          <InfoCard icon={CheckCircle} label="Kursy ukończone" numberOfItems={finishedCount} variant="course" />
        </div>

      </section>

      {/* Educational Paths Section */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-orange-700">Twoje ścieżki edukacyjne</h2>
        <EnrolledEduPathList items={educationalPaths} />
      </section>
      {/* Courses Section */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-blue-700">Twoje kursy</h2>
        <EnrolledEduList items={courses} />
      </section>
    </div>
  );
}
