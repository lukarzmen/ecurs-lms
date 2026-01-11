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
import { enUS, plPL } from "@clerk/localizations";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { createTranslator, getMessages, getRequestLocale } from "@/lib/i18n/server";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const messages = await getMessages(locale, "common");
  const t = createTranslator(messages);
  const clerkLocalization = locale === "en" ? enUS : plPL;
  const htmlLang = locale === "en" ? "en" : "pl-PL";

  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang={htmlLang}>
        <body className={inter.className}>
          <I18nProvider locale={locale} messages={messages}>
            <SignedIn>
              <ConfettiProvider />
              <ToastProvider />
            </SignedIn>
            {children}
          </I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
