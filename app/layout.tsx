import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ToastProvider from "@/components/providers/toast-provider";
import { ConfettiProvider } from "@/components/providers/confetti-provider";
import { AuthProvider } from "@/contexts/AuthContext";

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
    <html lang="en">
      <body className={inter.className}>
        <header></header>
     
          <ConfettiProvider/>
          <ToastProvider />
          <AuthProvider>
            {children}
          </AuthProvider>     
      </body>
    </html>
  );
}
