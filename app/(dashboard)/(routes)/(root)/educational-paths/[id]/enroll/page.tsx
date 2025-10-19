import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import EduPathPurchaseCard from "./_components/purchase-card";
import Link from "next/link";
import { ArrowLeft, XCircle, AlertTriangle } from "lucide-react";
import { cookies } from "next/headers";

type EnrollPathPageParams = Promise<{ id: string }>;


const EnrollPage = async ({ params, searchParams }: { 
  params: EnrollPathPageParams, 
  searchParams?: Promise<{ promoCode?: string; canceled?: string; failed?: string; }> 
}) => {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }
  const awaitedParams = await params;
  const awaitedSearchParams = searchParams ? await searchParams : {};
  const { id } = awaitedParams;
  const promoCode = awaitedSearchParams?.promoCode || "";
  const isCanceled = awaitedSearchParams?.canceled === '1';
  const isFailed = awaitedSearchParams?.failed === '1';

  return (
    <>
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-y-2 ml-2 mt-4 ">
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
    
      <EduPathPurchaseCard userId={userId} educationalPathId={id} promoCode={promoCode} />
    </>
  );
};

export default EnrollPage;