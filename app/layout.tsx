import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import ToastProvider from "@/components/providers/toast-provider";
import { ConfettiProvider } from "@/components/providers/confetti-provider";
import { plPL } from '@clerk/localizations'

const inter = Inter({ subsets: ["latin"] });

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
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Wylogowano</h2>
              <p className="text-gray-600 mb-6">
                Odśwież stronę, aby zalogować się ponownie.
              </p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Naciśnij F5 lub Ctrl+R aby odświeżyć stronę
                </p>
                <noscript>
                  <meta httpEquiv="refresh" content="0" />
                </noscript>
              </div>
            </div>
          </div>
          <RedirectToSignIn />
        </SignedOut>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
