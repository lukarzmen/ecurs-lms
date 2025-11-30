"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface JoinRequest {
  id: number;
  teacherId: number;
  schoolId: number;
  status: string;
  requestedAt: string;
  teacher: {
    id: number;
    displayName: string | null;
    email: string;
    companyName: string | null;
  };
  school: {
    id: number;
    name: string;
  };
}

interface SchoolMember {
  id: number;
  displayName: string | null;
  email: string;
  companyName: string | null;
  businessType: string | null;
  createdAt: string;
}

export default function ManageSchoolTeachersPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const params = useParams();
  const schoolId = parseInt(params.schoolId as string);

  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "members">("requests");

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        const [requestsRes, membersRes] = await Promise.all([
          fetch("/api/schools/pending-requests"),
          fetch(`/api/schools/${schoolId}/members`),
        ]);

        if (requestsRes.ok) {
          const data = await requestsRes.json();
          setPendingRequests(data.requests || []);
        }

        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Nie udało się załadować danych");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, schoolId]);

  const handleAcceptRequest = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      const response = await fetch(
        `/api/schools/requests/${requestId}/accept`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        toast.success("Prośba zaakceptowana");
        setPendingRequests((prev) =>
          prev.filter((req) => req.id !== requestId)
        );
        // Odśwież listę członków
        const membersRes = await fetch(`/api/schools/${schoolId}/members`);
        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data.members || []);
        }
      } else {
        toast.error("Nie udało się zaakceptować prośby");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Błąd podczas akceptacji prośby");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      const response = await fetch(
        `/api/schools/requests/${requestId}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Odmówiono dostępu" }),
        }
      );

      if (response.ok) {
        toast.success("Prośba odrzucona");
        setPendingRequests((prev) =>
          prev.filter((req) => req.id !== requestId)
        );
      } else {
        toast.error("Nie udało się odrzucić prośby");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Błąd podczas odrzucania prośby");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Zarządzaj nauczycielami szkoły</h1>
        <p className="text-muted-foreground mt-2">
          Akceptuj lub odrzucaj prośby nauczycieli o dołączenie do szkoły
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "requests"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Prośby o dołączenie ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "members"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Członkowie ({members.length})
        </button>
      </div>

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="space-y-4 pt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <p>Brak oczekujących prośb o dołączenie</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {request.teacher.displayName || "Bez nazwy"}
                  </CardTitle>
                  <CardDescription>{request.teacher.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {request.teacher.companyName && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Nazwa firmy:</span>{" "}
                        {request.teacher.companyName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Prośba wysłana:{" "}
                      {new Date(request.requestedAt).toLocaleDateString("pl-PL")}
                    </p>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={processingId === request.id}
                        className="flex-1 gap-2"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Zaakceptuj
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingId === request.id}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        Odrzuć
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-4 pt-6">
          {members.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <p>Brak członków szkoły</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {member.displayName || "Bez nazwy"}
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {member.businessType === "company"
                            ? "Firma"
                            : "Osoba fizyczna"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                      {member.companyName && (
                        <p className="text-sm text-muted-foreground">
                          {member.companyName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Dołączył:{" "}
                        {new Date(member.createdAt).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
