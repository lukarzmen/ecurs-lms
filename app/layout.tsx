import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import ToastProvider from "@/components/providers/toast-provider";
import { ConfettiProvider } from "@/components/providers/confetti-provider";
import { plPL } from '@clerk/localizations'
import Link from "next/link";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Ecurs - nowoczesna edukacja",
  description: "Ecurs to innowacyjna platforma edukacyjna, która oferuje tworzenie i uczestnictwo w interaktywnych wspieranych przez sztuczna inteligencję.",
  openGraph: {
    title: 'Ecurs - nowoczesna edukacja',
    description: 'Zacznij tworzyć interaktywne kursy online z Ecurs.',
    url: 'http://platforma.ecurs.pl/',
    type: 'website',
    images: [
      {
        url: 'http://platforma.ecurs.pl/demo4.png',
        width: 1200,
        height: 630,
        alt: 'Ecurs - nowoczesna edukacja',
      },
    ]
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider  localization={plPL}>
      <html lang="pl-PL">
        <body className={inter.className}>
        <SignedIn>
          <ConfettiProvider/>
          <ToastProvider />
          
        </SignedIn>
        <SignedOut>
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Ecurs — platforma nowoczesnej edukacji</h2>
              <p className="text-gray-600 mb-6">
                Zaloguj się lub załóż konto, aby przeglądać kursy, śledzić postępy i korzystać z funkcji platformy.
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/sign-in">Zaloguj się</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/sign-up">Załóż konto</Link>
                </Button>
              </div>
            </div>
          </div>
        </SignedOut>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
