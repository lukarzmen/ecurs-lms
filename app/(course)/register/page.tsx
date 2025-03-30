"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const { isSignedIn, userId, sessionId } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const handleSignUp = async () => {
        if (!isSignedIn) {
            toast.error("Zaloguj się, aby zakończyć rejestrację");
            return;
        }

        try {
            setIsLoading(true);
            
            const response = await fetch("/api/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    sessionId: sessionId,
                }),
            });

            if (response.ok) {
                toast.success("Rejestracja zakończona sukcesem!");
                router.push("/");
            } else {
                const errorData = await response.json();
                console.error("Błąd rejestracji użytkownika:", errorData);
                toast.error("Rejestracja nie powiodła się");
            }
        } catch (error) {
            console.error("Błąd rejestracji użytkownika:", error);
            toast.error("Nie udało się zarejestrować");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center max-w-md mx-auto text-center p-6 space-y-6 bg-white rounded-xl shadow-md">
                <h1 className="text-3xl font-bold text-gray-800">Witamy w Ecurs</h1>
                <p className="text-gray-600">
                    Dołącz do naszej platformy edukacyjnej, aby uzyskać dostęp do wszystkich kursów, zasobów i spersonalizowanych doświadczeń edukacyjnych.
                </p>
                <div className="w-16 h-1 bg-orange-500 mx-auto my-2"></div>
                <p className="text-sm text-gray-500">
                    Kliknij przycisk poniżej, aby zakończyć rejestrację i rozpocząć swoją edukacyjną podróż. Przechodząc dalej akceptujesz regulamin.
                </p>
                <button
                    onClick={handleSignUp}
                    disabled={isLoading || !isSignedIn}
                    className={`w-full py-4 px-8 rounded-lg font-medium text-white text-lg
                        ${isLoading || !isSignedIn
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-orange-600 hover:bg-orange-700 transition-colors"
                        }`}
                >
                    {isLoading ? "Przetwarzanie..." : "Zarejestruj się na platformie"}
                </button>
                {!isSignedIn && (
                    <p className="text-sm text-amber-600">
                        Proszę najpierw się zalogować, aby zakończyć rejestrację
                    </p>
                )}
            </div>
        </div>
    );
}
