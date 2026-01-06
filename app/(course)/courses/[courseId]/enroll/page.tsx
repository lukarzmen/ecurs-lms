import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PurchaseCard from "./_components/purchase-card";
import Link from "next/link";
import { ArrowLeft, XCircle, AlertTriangle } from "lucide-react";
import { cookies } from "next/headers";
import { SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

type EnrollCoursePageParams = Promise<{ courseId: string }>;


const EnrollPage = async ({ params, searchParams }: { 
  params: EnrollCoursePageParams, 
  searchParams?: Promise<{ promoCode?: string; canceled?: string; failed?: string; }> 
}) => {
  const { userId } = await auth();
  if (!userId) {
    return (
      <SignedOut>
        <div className="p-6">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Dokończ zapis na kurs</h1>
            <p className="text-gray-600">
              Zaloguj się lub załóż konto, aby zapisać się na kurs, mieć dostęp do materiałów i śledzić postępy.
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
  const awaitedParams = await params;
  const awaitedSearchParams = searchParams ? await searchParams : {};
  const { courseId } = awaitedParams;
  const promoCode = awaitedSearchParams?.promoCode || "";
  const isCanceled = awaitedSearchParams?.canceled === '1';
  const isFailed = awaitedSearchParams?.failed === '1';

  return (
    <>
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-y-2 ml-2">
      <Link
        href="/search"
        className="flex items-center text-sm hover:opacity-75 transition pt-4 select-none"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Powrót
      </Link>
      </div>
    </div>
    
    {/* Payment Status Messages */}
    {isCanceled && (
      <div className="mx-auto max-w-md mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Płatność została anulowana</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Możesz spróbować ponownie lub wybrać inną metodę płatności.
            </p>
          </div>
        </div>
      </div>
    )}
    
    {isFailed && (
      <div className="mx-auto max-w-md mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Płatność nie powiodła się</h3>
            <p className="text-sm text-red-700 mt-1">
              Sprawdź dane karty płatniczej i spróbuj ponownie. Jeśli problem się powtarza, skontaktuj się z nami.
            </p>
          </div>
        </div>
      </div>
    )}
    
      <PurchaseCard userId={userId} courseId={courseId} promoCode={promoCode} />
    </>
  );
};

export default EnrollPage;