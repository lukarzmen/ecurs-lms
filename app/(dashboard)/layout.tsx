"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import Footer from "./_components/footer";
import Navbar from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { Button } from "@/components/ui/button";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>
        <div className="min-h-screen flex flex-col">
          <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-50">
            <Navbar />
          </div>
          <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
            <Sidebar />
          </div>
          <main className="pt-16 h-full md:pl-56 flex-1">{children}</main>
          <Footer />
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Dołącz do platformy</h2>
            <p className="text-gray-600 mb-6">
              Zaloguj się lub załóż konto, aby mieć dostęp do panelu, kursów i postępów nauki.
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/sign-in">Zaloguj się</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-up">Załóż konto</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Odśwież stronę
              </Button>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
};

export default DashboardLayout;
