"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./_components/footer";
import Navbar from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useI18n();
  const pathname = usePathname();
    
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
        {pathname === "/" ? (
          <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-orange-200/35 blur-3xl" />
            <div className="relative">{children}</div>
          </div>
        ) : (
          <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-12">
            <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />

            <div className="relative mx-auto w-full max-w-6xl">
              <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
                <div className="hidden md:block">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      Ecurs LMS
                    </div>

                    <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">
                      {t("auth.signedOut.title")}
                    </h1>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                      {t("auth.signedOut.description")}
                    </p>

                    <div className="mt-8 grid gap-3 text-sm text-slate-700">
                      <div className="flex items-start gap-3 rounded-xl border bg-white/70 p-4 shadow-sm backdrop-blur">
                        <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-indigo-600" />
                        <div>
                          <div className="font-medium text-slate-900">Kursy i ścieżki w jednym miejscu</div>
                          <div className="mt-1 text-slate-600">Przeglądaj ofertę i zapisuj się w kilka sekund.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-xl border bg-white/70 p-4 shadow-sm backdrop-blur">
                        <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-orange-600" />
                        <div>
                          <div className="font-medium text-slate-900">Postępy i analityki</div>
                          <div className="mt-1 text-slate-600">Śledź naukę i wracaj dokładnie tam, gdzie skończyłeś.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center md:justify-end">
                  <div className="w-full max-w-md rounded-2xl border bg-white/80 p-8 shadow-xl backdrop-blur">
                    <div className="mb-6 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 11V7a4 4 0 0 0-8 0v4" />
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                        </svg>
                      </div>
                    </div>

                    <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 md:hidden">
                      {t("auth.signedOut.title")}
                    </h2>
                    <p className="mt-3 text-center text-sm leading-6 text-slate-600 md:hidden">
                      {t("auth.signedOut.description")}
                    </p>

                    <div className="mt-8 grid gap-3">
                      <Button asChild className="w-full">
                        <Link href={`/sign-in?redirectUrl=${encodeURIComponent(pathname ?? "/")}`}>{t("auth.signIn")}</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/sign-up?redirectUrl=${encodeURIComponent(pathname ?? "/")}`}>{t("auth.signUp")}</Link>
                      </Button>
                    </div>

                    <div className="mt-6 flex items-center justify-center">
                      <Button asChild variant="ghost" className="px-2 text-slate-600">
                        <Link href="/">{t("common.backToHome")}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SignedOut>
    </>
  );
};

export default DashboardLayout;
