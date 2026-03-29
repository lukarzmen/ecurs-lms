"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DataTable } from "./_components/data-table";
import { getColumns } from "./_components/columns";
import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

const EducationalPathsPage = () => {
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolStatus, setSchoolStatus] = useState<any>(null);
  const [schoolStatusLoading, setSchoolStatusLoading] = useState(true);
  const { t, locale } = useI18n();
  const columns = getColumns(t);

  const handlePathDeleted = (pathId: unknown) => {
    setPaths((prev) => prev.filter((path) => path?.id !== pathId));
  };

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const fetchPaths = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/educational-paths?userId=${userId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setPaths(data);
      } catch (error) {
        console.error("Error fetching educational paths:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSchoolStatus = async () => {
      setSchoolStatusLoading(true);
      try {
        const res = await fetch("/api/user/school-status");
        const data = await res.json();
        setSchoolStatus(data);
      } catch (error) {
        console.error("Error fetching school status:", error);
      } finally {
        setSchoolStatusLoading(false);
      }
    };

    if (userId && isSignedIn) {
      fetchPaths();
      fetchSchoolStatus();
    }
  }, [userId, isSignedIn, router]);

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-gray-600" />
            <span>{t("epList.title")}</span>
            <span className="text-sm md:text-lg font-normal text-gray-500 bg-gray-100 px-2 py-1 md:px-3 rounded-full">
              {paths.length}
            </span>
          </h1>
          <p className="text-gray-600 mt-2">
            {t("epList.subtitle")}
          </p>
        </div>
        <Link href="/teacher/educational-paths/create" className="w-full md:w-auto">
          <Button size="lg" className="w-full md:w-auto">
            <Plus className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">{t("epList.newPath")}</span>
            <span className="sm:hidden">{t("epList.newPathShort")}</span>
          </Button>
        </Link>
      </div>

      {/* School Status Alert */}
      {!schoolStatusLoading && schoolStatus && !schoolStatus.isMemberOfSchool && !schoolStatus.ownsSchool && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 md:p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100">
                <span className="text-yellow-600 text-lg">⏳</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm md:text-base font-semibold text-yellow-900 mb-2">
                {t("epList.pendingTitle")}
              </h3>
              {schoolStatus.hasPendingRequests && schoolStatus.pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-yellow-800">
                    {t("epList.pendingMessage").replace("{count}", String(schoolStatus.pendingRequests.length))}
                  </p>
                  <div className="space-y-2">
                    {schoolStatus.pendingRequests.map((req: any) => (
                      <div key={req.id} className="bg-white rounded p-3 border border-yellow-100">
                        <p className="text-sm font-medium text-gray-900">{req.schoolName}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {t("epList.owner")} <span className="font-medium">{req.ownerName}</span>
                          {req.ownerEmail && <> ({req.ownerEmail})</>}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t("epList.sentAt")} {new Date(req.requestedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'pl-PL')}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-yellow-800 mt-3">
                    {t("epList.contactHint")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-yellow-800">
                  {t("epList.pendingNoRequests")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-gray-600 h-8 w-8" />
        </div>
      ) : (
        <>
          {/* Educational Paths Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <DataTable
              columns={columns}
              data={paths}
              onPathDeleted={handlePathDeleted}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default EducationalPathsPage;
