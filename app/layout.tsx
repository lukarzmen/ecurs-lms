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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ecurs",
  description: "Ecurs is a platform for creating and selling courses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
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
