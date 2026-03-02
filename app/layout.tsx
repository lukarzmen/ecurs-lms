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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ecurs.pl'),
  title: "Ecurs - nowoczesna edukacja",
  description: "Ecurs to innowacyjna platforma edukacyjna, która oferuje tworzenie i uczestnictwo w interaktywnych kursach wspieranych przez sztuczną inteligencję.",
  openGraph: {
    title: 'Ecurs - nowoczesna edukacja',
    description: 'Zacznij tworzyć interaktywne kursy online z Ecurs. Platforma wspierana przez AI.',
    url: 'https://ecurs.pl/',
    siteName: 'Ecurs',
    type: 'website',
    locale: 'pl_PL',
    images: [
      {
        url: '/demo4.png',
        width: 1200,
        height: 630,
        alt: 'Ecurs - nowoczesna edukacja',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ecurs - nowoczesna edukacja',
    description: 'Zacznij tworzyć interaktywne kursy online z Ecurs. Platforma wspierana przez AI.',
    images: ['/demo4.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const getDbServerLabel = () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return null;

    try {
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port ? `:${url.port}` : "";
      const dbName = url.pathname?.replace(/^\//, "") || "";
      const dbSuffix = dbName ? `/${dbName}` : "";
      return `${host}${port}${dbSuffix}`;
    } catch {
      // If DATABASE_URL is not a valid URL (e.g. special formats), do not risk leaking it.
      return "(unparseable)";
    }
  };

  const locale = await getRequestLocale();
  const messages = await getMessages(locale, "common");
  const t = createTranslator(messages);
  const clerkLocalization = locale === "en" ? enUS : plPL;
  const htmlLang = locale === "en" ? "en" : "pl-PL";

  const isTestEnvironment = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_TEST_ENV === 'true';
  const dbServerLabel = isTestEnvironment ? getDbServerLabel() : null;

  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang={htmlLang}>
        <head>
          <meta property="fb:app_id" content="580840648168709" />
          <script
            dangerouslySetInnerHTML={{
              __html:
                "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init', '1563936648199144'); fbq('track', 'PageView');",
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              alt=""
              src="https://www.facebook.com/tr?id=1563936648199144&ev=PageView&noscript=1"
            />
          </noscript>
        </head>
        <body className={inter.className}>
          {isTestEnvironment && (
            <div className="bg-yellow-400 text-black text-center py-2 px-4 font-bold text-sm fixed bottom-0 left-0 right-0 z-[9999] shadow-md">
              ⚠️ ŚRODOWISKO TESTOWE / TEST ENVIRONMENT ⚠️
              {dbServerLabel ? ` | DB: ${dbServerLabel}` : ""}
            </div>
          )}
          <div>
            <I18nProvider locale={locale} messages={messages}>
            <SignedIn>
              <ConfettiProvider />
              <ToastProvider />
            </SignedIn>
            {children}
          </I18nProvider>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
