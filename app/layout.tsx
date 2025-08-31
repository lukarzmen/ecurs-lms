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
        </SignedIn>
        <SignedOut>
          Odśwież stronę, aby zalogować się ponownie.
          <RedirectToSignIn />
        </SignedOut>
        <ConfettiProvider/>
        <ToastProvider />
        {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
