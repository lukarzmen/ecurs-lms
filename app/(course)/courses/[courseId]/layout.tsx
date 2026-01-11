import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CourseSidebar } from "./_components/course-sidebar";
import { CourseNavbar } from "./_components/course-navbar";
import { SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// Import Footer (adjust the path if needed)
import Footer from "@/app/(dashboard)/_components/footer";

const CourseLayout = async ({ children, params }: {
    children: React.ReactNode;
    params: Promise<{ courseId: string; }>;
}) => {
    const resolvedParams = await params;
    const { userId } = await auth();
    if (!userId) {
        return (
            <SignedOut>
                <div className="min-h-screen flex items-center justify-center p-6">
                    <section className="max-w-3xl rounded-xl border bg-white p-6 sm:p-8">
                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                Zaloguj się, aby rozpocząć naukę 🚀
                            </h1>
                            <p className="text-gray-600 text-base sm:text-lg">
                                Po zalogowaniu odblokujesz materiały kursu, zapis postępów i wszystkie funkcje nauki w Ecurs.
                            </p>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border bg-white p-4">
                                <div className="font-semibold text-gray-900">📚 Materiały</div>
                                <div className="mt-1 text-sm text-gray-600">Pełny dostęp do lekcji i zasobów.</div>
                            </div>
                            <div className="rounded-lg border bg-white p-4">
                                <div className="font-semibold text-gray-900">✅ Postępy</div>
                                <div className="mt-1 text-sm text-gray-600">Kontynuuj dokładnie tam, gdzie skończyłeś.</div>
                            </div>
                            <div className="rounded-lg border bg-white p-4">
                                <div className="font-semibold text-gray-900">💬 Funkcje kursu</div>
                                <div className="mt-1 text-sm text-gray-600">Pełne doświadczenie i interakcje.</div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 max-w-sm mx-auto">
                            <Button asChild className="w-full h-12 text-base">
                                <Link href={`/sign-in?redirectUrl=${encodeURIComponent(`/courses/${resolvedParams.courseId}`)}`}>Zaloguj się</Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full h-12 text-base">
                                <Link href={`/sign-up?redirectUrl=${encodeURIComponent(`/courses/${resolvedParams.courseId}`)}`}>Załóż konto ✨</Link>
                            </Button>
                        </div>
                    </section>
                </div>
            </SignedOut>
        );
    }
    const courseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${resolvedParams.courseId}/chapters?providerId=${userId}`);
    const course = await courseResponse.json();

    if(!course) {
        return redirect('/');
    }
    return (
        <div className="flex flex-col min-h-screen">
            <div className="h-[80px] md:pl-80 fixed inset-y-0 w-full z-50">
                <CourseNavbar course={course} />
            </div>
            <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50">
                <CourseSidebar course={course} />
            </div>
            <main className="md:pl-80 pt-[80px] flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default CourseLayout;