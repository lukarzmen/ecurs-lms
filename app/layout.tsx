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
  description: "Ecurs to nowoczesna i innowacyjna platforma edukacyjna, która oferuje tworzenie i uczestnictwo w intekarkywnych kursach wykorzystujących sztuczna inteligencję.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={plPL}>
      <html lang="pl-PL">
        <body className={inter.className}>
        <SignedIn>
        </SignedIn>
        <SignedOut>
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
