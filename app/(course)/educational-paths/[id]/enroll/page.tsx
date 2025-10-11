import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import EduPathPurchaseCard from "./_components/purchase-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";

type EnrollPathPageParams = Promise<{ id: string }>;


const EnrollPage = async ({ params, searchParams }: { params: EnrollPathPageParams, searchParams?: Promise<{ promoCode?: string }> }) => {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }
  const awaitedParams = await params;
  const awaitedSearchParams = searchParams ? await searchParams : {};
  const { id } = awaitedParams;
  const promoCode = awaitedSearchParams?.promoCode || "";

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
      <EduPathPurchaseCard userId={userId} educationalPathId={id} promoCode={promoCode} />
    </>
  );
};

export default EnrollPage;