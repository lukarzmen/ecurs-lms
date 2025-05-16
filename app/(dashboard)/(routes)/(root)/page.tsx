import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { CoursesList } from "@/components/ui/courses-list";
import { auth } from "@clerk/nextjs/server";
import { CheckCircle, Clock } from "lucide-react";
import { InfoCard } from "./_components/info-card";
import { redirect } from "next/navigation";
import {authorizeUser} from "@/hooks/use-auth";
import { DashboardCoursesResponse, CourseDetails } from "@/app/api/user/courses/route"; // Import CourseDetails

export default async function Home() {
  const {userId, sessionId} = auth();
  if(!userId) {
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
    <div className="min-h-screen px-4 pt-4">
      <SignedOut>
      <div className="flex items-center justify-center">
        <SignIn  />
      </div>
      </SignedOut>
      <SignedIn>
      <div className="p-6 space-y-4">
        {fetchError && ( // Conditionally render an error message
          <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            <span className="font-medium">Błąd!</span> Nie udało się załadować kursów: {fetchError}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard icon={Clock} label="W trakcie" numberOfItems={unfinishedCount} />
        <InfoCard icon={CheckCircle} label="Ukończono" numberOfItems={finishedCount} />
        </div>
        <CoursesList items={courses} />
      </div>
      </SignedIn>
    </div>
  );
}
