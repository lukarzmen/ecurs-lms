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
            alert("You need to sign in first");
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
                toast.success("Registration successful!");
                router.push("/");
            } else {
                const errorData = await response.json();
                console.error("Error registering user:", errorData);
                toast.error("Registration failed");
            }
        } catch (error) {
            console.error("Error registering user:", error);
            toast.error("Failed to register");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center max-w-md mx-auto text-center p-6 space-y-6 bg-white rounded-xl shadow-md">
                <h1 className="text-3xl font-bold text-gray-800">Welcome to eCurs LMS</h1>
                <p className="text-gray-600">
                    Join our learning platform to get access to all courses, resources, and personalized learning experiences.
                </p>
                <div className="w-16 h-1 bg-blue-500 mx-auto my-2"></div>
                <p className="text-sm text-gray-500">
                    Click the button below to complete your registration and start your learning journey.
                </p>
                <button
                    onClick={handleSignUp}
                    disabled={isLoading || !isSignedIn}
                    className={`w-full py-4 px-8 rounded-lg font-medium text-white text-lg
                        ${isLoading || !isSignedIn
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 transition-colors"
                        }`}
                >
                    {isLoading ? "Processing..." : "Register for Platform Access"}
                </button>
                {!isSignedIn && (
                    <p className="text-sm text-amber-600">
                        Please sign in first to complete registration
                    </p>
                )}
            </div>
        </div>
    );
}
