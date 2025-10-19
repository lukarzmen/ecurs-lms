import React from "react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import CourseInfoCard from "@/components/ui/course-card";

export default async function EducationalPathPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ success?: string; canceled?: string; }>;
}) {
    const userAuth = await auth();
    const awaitedParams = await params;
    const awaitedSearchParams = searchParams ? await searchParams : {};
    
    if (!userAuth) {
        return redirect(`/sign-in?redirectUrl=${encodeURIComponent(`/educational-paths/${awaitedParams.id}`)}`);
    }

    // Handle payment status from Stripe redirect
    if (awaitedSearchParams.canceled === '1') {
        // Payment was canceled, ensure userEducationalPath state is set to 0
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/educational-paths/${awaitedParams.id}/payment-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'canceled' })
            });
        } catch (error) {
            console.error('Failed to update payment status:', error);
        }
        
        // Redirect to enrollment page with canceled status
        return redirect(`/educational-paths/${awaitedParams.id}/enroll?canceled=1`);
    }

    if (awaitedSearchParams.success === '0') {
        // Payment failed, ensure userEducationalPath state is set to 0
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/educational-paths/${awaitedParams.id}/payment-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'failed' })
            });
        } catch (error) {
            console.error('Failed to update payment status:', error);
        }
        
        // Redirect to enrollment page with failed status
        return redirect(`/educational-paths/${awaitedParams.id}/enroll?failed=1`);
    }

    // Fetch educational path details and courses for user
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/educational-paths/${awaitedParams.id}/user?userId=${userAuth.userId}`);
    const data = await res.json();
    if (!data || data.error) {
        return redirect('/');
    }
    // Statystyki kursów w ścieżce
    const totalCourses = data.courses.length;
    // Zakładamy, że kurs ma pole isCompleted (jeśli nie, domyślnie false)
    const finishedCourses = data.courses.filter((c: any) => c.isCompleted).length;
    const unfinishedCourses = totalCourses - finishedCourses;

    return (
        <div className="max-w-5xl py-8 ml-4 mr-4">
            <Link
                href="/"
                className="flex items-center text-sm hover:opacity-75 transition pt-4 select-none mb-4"
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Powrót do listy kursów
            </Link>
            <h1 className="text-2xl font-bold mb-6">Twoja ścieżka</h1>
            <div className="mb-8 p-6 rounded bg-orange-50 border border-orange-200">
                <h2 className="text-xl font-bold mb-2">{data.title}</h2>
                <p className="mb-2 text-gray-700">{data.description}</p>
                {data.imageId && (
                    <div className="w-32 h-32 relative mb-2 rounded overflow-hidden">
                        <Image
                            src={`/api/image/${data.imageId}`}
                            alt={data.title}
                            fill
                            className="object-cover rounded"
                            sizes="128px"
                            priority
                        />
                    </div>
                )}
                <div className="flex flex-wrap gap-4 mt-2 mb-2">
                    <div className="text-sm text-gray-500">Autor: {data.authorName || "Nieznany"}</div>
                    <div className="text-sm text-gray-500">Kategoria: {data.categoryName || "Brak"}</div>
                    <div className="text-sm text-gray-500">Kursów w ścieżce: <span className="font-semibold">{totalCourses}</span></div>
                    <div className="text-sm text-green-600">Ukończone: <span className="font-semibold">{finishedCourses}</span></div>
                    <div className="text-sm text-orange-600">W trakcie: <span className="font-semibold">{unfinishedCourses}</span></div>
                </div>
            </div>
            <h1 className="text-2xl font-bold mb-6">Kursy w tej ścieżce edukacyjnej</h1>
            <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.courses.map((course: any) => (
                    <CourseInfoCard
                        key={course.courseId}
                        id={course.courseId}
                        title={course.title}
                        imageId={course.imageId ?? ""}
                        author={data.authorName || "Nieznany autor"}
                        modulesCount={course.modulesCount}
                        category={data.categoryName || "Brak kategorii"}
                        isCompleted={course.isCompleted ?? false}
                    />
                ))}
            </div>
        </div>
    );
}