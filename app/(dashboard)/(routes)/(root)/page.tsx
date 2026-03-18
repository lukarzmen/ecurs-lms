import { auth } from "@clerk/nextjs/server";
import { CheckCircle, Clock, Home as HomeIcon, BookOpen, GraduationCap } from "lucide-react";
import { InfoCard } from "./_components/info-card";
import { redirect } from "next/navigation";
import { authorizeUser } from "@/hooks/use-auth";
import { DashboardCoursesResponse, CourseDetails } from "@/app/api/user/courses/route"; // Import CourseDetails
import { EnrolledEduList } from "@/components/ui/enrolled-list";
import { EnrolledEduList as EnrolledEduPathList } from "@/components/ui/enrolled-list";
import Link from "next/link";
import Image from "next/image";
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
    const res = await fetch(apiUrl, { next: { revalidate: 3600, tags: ["learning-units-search"] } });
    const courses = await res.json();

    return (
      <div className="p-6 space-y-10 bg-gradient-to-b from-gray-50 to-white">
        <section className="max-w-6xl mx-auto rounded-2xl border bg-white p-6 sm:p-10 shadow-sm">
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Image
                src="/logo.png"
                alt="Ecurs"
                width={40}
                height={40}
                className="h-10 w-10"
                priority
              />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Ecurs — uczysz się skuteczniej
              </h1>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-center">
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  <span className="underline underline-offset-4 decoration-4 decoration-orange-600">
                    Jesteś uczniem?
                  </span>
                </div>
                <p className="mt-2 text-gray-600 text-sm sm:text-base">
                  Ucz się we własnym tempie i miej postępy zawsze pod ręką.
                </p>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  <span className="underline underline-offset-4 decoration-4 decoration-orange-600">
                    Jesteś nauczycielem?
                  </span>
                </div>
                <p className="mt-2 text-gray-600 text-sm sm:text-base">
                  Twórz kursy i ścieżki w jednym miejscu, a AI niech pomoże Ci przygotować materiały szybciej i lepiej.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-gray-50 p-4 transition-colors hover:bg-white">
              <div className="font-semibold text-gray-900">🎓 Dla uczniów</div>
              <div className="mt-1 text-sm text-gray-600 leading-relaxed">
                Dostawaj lekcje, zadania i jasny plan nauki, który napędza do działania.
              </div>
            </div>
            <div className="rounded-xl border bg-gray-50 p-4 transition-colors hover:bg-white">
              <div className="font-semibold text-gray-900">🧑‍🏫 Dla nauczycieli</div>
              <div className="mt-1 text-sm text-gray-600 leading-relaxed">
                Twórz kursy, ścieżki i materiały w jednym panelu, gotowe do sprzedaży i pracy z grupą.
              </div>
            </div>
            <div className="rounded-xl border bg-gray-50 p-4 transition-colors hover:bg-white">
              <div className="font-semibold text-gray-900">🤖 Wsparcie AI</div>
              <div className="mt-1 text-sm text-gray-600 leading-relaxed">
                AI pomaga w tworzeniu treści i wspiera uczniów w rozwoju.
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border bg-gray-50 p-4 sm:p-6">
            <div className="text-center text-sm sm:text-base font-semibold text-gray-900">
              Na platformie znajdziesz
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                <span className="text-lg">🎯</span>
                <span>Ścieżki edukacyjne</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                <span className="text-lg">⚡</span>
                <span>Kursy</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                <span className="text-lg">🧩</span>
                <span>Interaktywne zadania</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                <span className="text-lg">🔔</span>
                <span>Powiadomienia</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                <span className="text-lg">📈</span>
                <span>Analityki postępów</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                <span className="text-lg">💳</span>
                <span>Płatności i sprzedaż</span>
              </div>
            </div>
          </div>
        </section>
        <section className="max-w-6xl mx-auto rounded-2xl border bg-white p-6 sm:p-10 shadow-sm">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Dołącz do platformy i zacznij od razu ✨</h2>
            <p className="text-gray-600">
              <span className="block">Wybierz kurs i zacznij od razu.</span>
              <span className="block">Jeśli uczysz innych — twórz własne programy i obserwuj realne postępy grupy.</span>
            </p>
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

        <section className="max-w-6xl mx-auto rounded-2xl border bg-white p-6 sm:p-10 shadow-sm">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Kursy czekają na Ciebie 👇</h2>
            <p className="text-gray-600">
              Wybierz temat i zacznij naukę od razu 🛫
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {/* <Categories items={categories} /> */}
            <MarketplaceCoursesList items={courses} />
          </div>
        </section>
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

      {!fetchError && courses.length === 0 && educationalPaths.length === 0 && (
        <section className="rounded-xl border bg-white p-6">
          <div className="text-center space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Nie dołączyłeś jeszcze do żadnego kursu ani ścieżki
            </h2>
            <p className="text-gray-600">
              Aby wyszukać kursy i ścieżki, przejdź do zakładki Odkrywaj.
            </p>
            <Button asChild className="h-11">
              <Link href="/search">Odkrywaj</Link>
            </Button>
          </div>
        </section>
      )}
      
      {/* Progress Section */}
      <section>
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3">
        <CheckCircle className="h-8 w-8 text-orange-600" />
        Twoje postępy
          </h2>
          <p className="text-gray-600">
        Śledź swoje osiągnięcia w ścieżkach edukacyjnych i kursach
          </p>
        </div>
        
        {/* Educational Paths statistics */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-orange-600" />
        Ścieżki edukacyjne
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <InfoCard icon={Clock} label="Ścieżki w trakcie" numberOfItems={eduPathUnfinishedCount} variant="path" />
        <InfoCard icon={CheckCircle} label="Ścieżki ukończone" numberOfItems={eduPathFinishedCount} variant="path" />
          </div>
        </div>
        
        {/* Courses statistics */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-orange-600" />
        Kursy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
