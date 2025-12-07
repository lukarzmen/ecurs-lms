"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Check, X, Loader2, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

interface SchoolData {
  id: number;
  name: string;
  description: string | null;
  companyName: string;
  taxId: string;
  ownerId: number;
}

export default function ManageSchoolPage() {
  const { userId } = useAuth();
  const router = useRouter();

  const [school, setSchool] = useState<SchoolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedSchool, setEditedSchool] = useState<Partial<SchoolData>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const [activeTab, setActiveTab] = useState<"info" | "members">("info");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Search and invite states
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      if (!userId) return;

      try {
        const response = await fetch("/api/schools/my-school");
        if (response.ok) {
          const data = await response.json();
          setSchool(data.school);
          setEditedSchool(data.school);
        } else if (response.status === 404) {
          toast.error("Nie masz przypisanej szkoły");
          setTimeout(() => router.push("/teacher/courses"), 2000);
        } else {
          toast.error("Nie udało się załadować danych szkoły");
        }
      } catch (error) {
        console.error("Error fetching school:", error);
        toast.error("Błąd podczas ładowania szkoły");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchMembers = async () => {
      try {
        const [requestsRes, membersRes] = await Promise.all([
          fetch("/api/schools/pending-requests"),
          fetch("/api/schools/my-school/members"),
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
        console.error("Error fetching members:", error);
      }
    };

    fetchSchool();
    fetchMembers();
  }, [userId, router]);

  // Debounced search
  useEffect(() => {
    if (search.trim().split(" ").join("").length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/student/search?q=${encodeURIComponent(search)}`, {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, [search]);

  const handleInputChange = (field: keyof SchoolData, value: string) => {
    setEditedSchool((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!school || !editedSchool.name?.trim() || !editedSchool.companyName?.trim() || !editedSchool.taxId?.trim()) {
      toast.error("Wszystkie pola są wymagane");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/schools/${school.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedSchool.name,
          description: editedSchool.description || "",
          companyName: editedSchool.companyName,
          taxId: editedSchool.taxId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSchool(data.school);
        setEditedSchool(data.school);
        setHasChanges(false);
        toast.success("Dane szkoły zostały zaktualizowane");
      } else {
        toast.error("Nie udało się zaktualizować danych szkoły");
      }
    } catch (error) {
      console.error("Error saving school:", error);
      toast.error("Błąd podczas zapisywania zmian");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/schools/requests/${requestId}/accept`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success("Prośba zaakceptowana");
        setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
        // Odśwież listę członków
        const membersRes = await fetch("/api/schools/my-school/members");
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
      const response = await fetch(`/api/schools/requests/${requestId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Odmówiono dostępu" }),
      });

      if (response.ok) {
        toast.success("Prośba odrzucona");
        setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
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

  const handleSelectUser = (user: any) => {
    setSelectedUsers(prev =>
      prev.some(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleInviteConfirm = async () => {
    if (selectedUsers.length === 0) return;
    setIsInviting(true);
    try {
      await axios.post(`/api/schools/invite-teachers`, {
        userIds: selectedUsers.map(u => u.id),
      });
      toast.success(`Zaproszono ${selectedUsers.length} nauczycieli`);
      setShowInvite(false);
      setSearch("");
      setSearchResults([]);
      setSelectedUsers([]);
      // Odśwież listę prośb
      const requestsRes = await fetch("/api/schools/pending-requests");
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setPendingRequests(data.requests || []);
      }
    } catch (error) {
      toast.error("Nie udało się zaprosić nauczycieli");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm("Czy na pewno chcesz usunąć tego nauczyciela ze szkoły?")) return;
    
    setProcessingId(memberId);
    try {
      const response = await fetch(`/api/schools/members/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success("Nauczyciel został usunięty ze szkoły");
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        toast.error("Nie udało się usunąć nauczyciela");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Błąd podczas usuwania nauczyciela");
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

  if (!school) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Twoja szkoła</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj informacjami o swojej szkole i członkami zespołu
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "info"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Informacje o szkole
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

      {/* Info Tab */}
      {activeTab === "info" && (
        <div className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dane szkoły</CardTitle>
              <CardDescription>
                Edytuj informacje o swojej szkole
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa szkoły/placówki *
                </label>
                <Input
                  type="text"
                  value={editedSchool.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="np. Szkoła Podstawowa nr 1"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis szkoły
                </label>
                <textarea
                  value={editedSchool.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Dodaj krótki opis Twojej szkoły..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa firmy *
                </label>
                <Input
                  type="text"
                  value={editedSchool.companyName || ""}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="np. Przykładowa Sp. z o.o."
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIP *
                </label>
                <Input
                  type="text"
                  value={editedSchool.taxId || ""}
                  onChange={(e) => handleInputChange("taxId", e.target.value)}
                  placeholder="np. 1234567890"
                  className="w-full"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving || !hasChanges}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Zapisz zmiany
                </Button>
                <Button
                  onClick={() => {
                    setEditedSchool(school);
                    setHasChanges(false);
                  }}
                  variant="outline"
                  disabled={!hasChanges}
                >
                  Anuluj
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="pt-6 space-y-6">
          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Prośby o dołączenie</CardTitle>
              <CardDescription>
                {pendingRequests.length} oczekujące prośby
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <p>Brak oczekujących prośb o dołączenie</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {request.teacher.displayName || "Bez nazwy"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {request.teacher.email}
                        </p>
                        {request.teacher.companyName && (
                          <p className="text-sm text-muted-foreground">
                            {request.teacher.companyName}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={processingId === request.id}
                          size="sm"
                          className="gap-2"
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
                          size="sm"
                          className="gap-2"
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Członkowie szkoły</CardTitle>
              <CardDescription>
                {members.length} członków w zespole
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Nauczyciele zatrudnieni w Twojej szkole</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInvite(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Zaproś nauczyciela
                </Button>
              </div>
              {members.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <p>Brak członków szkoły</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {member.displayName || "Bez nazwy"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                        {member.companyName && (
                          <p className="text-sm text-muted-foreground">
                            {member.companyName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Dołączył:{" "}
                          {new Date(member.createdAt).toLocaleDateString("pl-PL")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {member.businessType === "company"
                            ? "Firma"
                            : "Osoba fizyczna"}
                        </span>
                        <Button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={processingId === member.id}
                          variant="outline"
                          size="sm"
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {processingId === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Usuń
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-background border rounded-lg shadow-lg p-6 min-w-[320px]">
            <h2 className="text-lg font-semibold mb-4">Zaproś nauczycieli</h2>
            <div className="mb-4">
              <input
                type="text"
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary"
                placeholder="Wpisz imię, nazwisko lub email"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            {isSearching && (
              <div className="flex justify-center py-2">
                <Loader2 className="animate-spin" />
              </div>
            )}
            {!isSearching && searchResults.length > 0 && (
              <ul className="max-h-48 overflow-y-auto">
                {searchResults.map(user => (
                  <li key={user.id} className="flex items-center py-2 border-b last:border-b-0 hover:bg-muted transition">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedUsers.some(u => u.id === user.id)}
                      onChange={() => handleSelectUser(user)}
                    />
                    <span>
                      {user.firstName} {user.lastName} ({user.email})
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {!isSearching && search && searchResults.length === 0 && (
              <div className="text-sm text-muted-foreground">Brak wyników.</div>
            )}
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInvite(false);
                  setSelectedUsers([]);
                }}
              >
                Zamknij
              </Button>
              <Button
                disabled={selectedUsers.length === 0 || isInviting}
                onClick={handleInviteConfirm}
              >
                {isInviting ? <Loader2 className="animate-spin" size={20} /> : "Zaproś wybranych"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
