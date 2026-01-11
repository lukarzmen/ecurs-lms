import { auth } from "@clerk/nextjs/server";
import { CheckCircle, Clock, Home as HomeIcon, BookOpen, GraduationCap } from "lucide-react";
import { InfoCard } from "./_components/info-card";
import { redirect } from "next/navigation";
import { authorizeUser } from "@/hooks/use-auth";
import { DashboardCoursesResponse, CourseDetails } from "@/app/api/user/courses/route"; // Import CourseDetails
import { EnrolledEduList } from "@/components/ui/enrolled-list";
import { EnrolledEduList as EnrolledEduPathList } from "@/components/ui/enrolled-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Categories } from "@/app/(dashboard)/(routes)/search/_components/categories";
import { MarketplaceCoursesList } from "@/components/ui/marketplace-list";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ title?: string; categoryId?: string }>;
}) {
  let educationalPaths: any[] = [];
  let eduPathFinishedCount = 0;
  let eduPathUnfinishedCount = 0;
  const { userId, sessionId } = await auth();
  if (!userId) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const { title = "", categoryId = "" } = resolvedSearchParams || {};

    const resCategories = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
      { next: { revalidate: 60 } }
    );

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/courses/search?title=${encodeURIComponent(
      title
    )}&categoryId=${encodeURIComponent(categoryId)}`;
    const res = await fetch(apiUrl);
    const courses = await res.json();

    return (
      <div className="p-6 space-y-8">
        <section className="max-w-4xl mx-auto rounded-xl border bg-white p-6 sm:p-8">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Ecurs 🎓 — ucz się nowocześnie, po swojemu
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Odkrywaj kursy i ścieżki edukacyjne, rozwijaj kompetencje i wracaj do nauki, kiedy chcesz.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-4">
              <div className="font-semibold text-gray-900">🚀 Szybki start</div>
              <div className="mt-1 text-sm text-gray-600">Wybierz temat i zacznij od razu.</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="font-semibold text-gray-900">🧠 Nauka w tempie</div>
              <div className="mt-1 text-sm text-gray-600">Wracaj do materiałów, kiedy potrzebujesz.</div>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="font-semibold text-gray-900">📈 Postępy i dostęp</div>
              <div className="mt-1 text-sm text-gray-600">Zaloguj się, żeby zapisywać i śledzić postępy.</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 max-w-sm mx-auto">
            <Button asChild className="w-full h-12 text-base">
              <Link href={`/sign-in?redirectUrl=${encodeURIComponent("/")}`}>Zaloguj się</Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 text-base">
              <Link href={`/sign-up?redirectUrl=${encodeURIComponent("/")}`}>Dołącz teraz ✨</Link>
            </Button>
          </div>
        </section>

        <div className="max-w-3xl mx-auto text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Kursy czekają na Ciebie 👇</h2>
          <p className="text-gray-600">
            Poniżej znajdziesz dostępne kursy i ścieżki. Wybierz coś dla siebie, a jeśli chcesz mieć dostęp do materiałów i
            zapisywać postępy — zaloguj się lub dołącz do Ecurs ✨
          </p>
        </div>

        <div className="space-y-6">
          {/* <Categories items={categories} /> */}
          <MarketplaceCoursesList items={courses} />
        </div>
      </div>
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
