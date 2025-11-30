"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface School {
  id: number;
  name: string;
  description: string | null;
  companyName: string;
  ownerId: number;
  _count: {
    members: number;
  };
}

interface JoinStatus {
  [schoolId: number]: "idle" | "pending" | "requested" | "member" | "error";
}

export default function FindSchoolsPage() {
  const { userId } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState<JoinStatus>({});
  const [userBusinessType, setUserBusinessType] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        // Pobierz typ działalności użytkownika
        const userRes = await fetch("/api/user/profile");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserBusinessType(userData.businessType);

          // Jeśli nie jest spółką, nie pokazuj tej strony
          if (userData.businessType !== "company") {
            toast.error("Tylko nauczyciele ze statusem spółki mogą dołączyć do szkoły");
            return;
          }
        }

        // Pobierz listę szkół
        const schoolsRes = await fetch("/api/schools/list");
        if (schoolsRes.ok) {
          const data = await schoolsRes.json();
          setSchools(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Nie udało się załadować danych");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleJoinRequest = async (schoolId: number) => {
    setJoinStatus((prev) => ({ ...prev, [schoolId]: "pending" }));
    try {
      const response = await fetch("/api/schools/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId }),
      });

      if (response.ok) {
        setJoinStatus((prev) => ({ ...prev, [schoolId]: "requested" }));
        toast.success("Prośba o dołączenie wysłana!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Nie udało się wysłać prośby");
        setJoinStatus((prev) => ({ ...prev, [schoolId]: "error" }));
      }
    } catch (error) {
      console.error("Error sending join request:", error);
      toast.error("Błąd podczas wysyłania prośby");
      setJoinStatus((prev) => ({ ...prev, [schoolId]: "error" }));
    }
  };

  if (!userBusinessType) {
    return (
      <div className="p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4" />
              <p>
                Tylko nauczyciele ze statusem spółki mogą dołączyć do szkoły.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userBusinessType !== "company") {
    return (
      <div className="p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4" />
              <p>
                Twój typ działalności to: {userBusinessType}. Tylko spółki mogą
                dołączyć do szkoły.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold">Znajdź szkołę</h1>
        <p className="text-muted-foreground mt-2">
          Przeglądaj dostępne szkoły i poproś o dołączenie do zespołu
        </p>
      </div>

      {schools.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <p>Brak dostępnych szkół</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <Card key={school.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{school.name}</CardTitle>
                <CardDescription>{school.companyName}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {school.description && (
                  <p className="text-sm text-muted-foreground">
                    {school.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Członkowie: {school._count.members}</span>
                </div>
                <Button
                  onClick={() => handleJoinRequest(school.id)}
                  disabled={
                    joinStatus[school.id] === "pending" ||
                    joinStatus[school.id] === "requested"
                  }
                  className="w-full gap-2"
                >
                  {joinStatus[school.id] === "pending" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : joinStatus[school.id] === "requested" ? (
                    <span>✓ Prośba wysłana</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Poproś o dołączenie
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
