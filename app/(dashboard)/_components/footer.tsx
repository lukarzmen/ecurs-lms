"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/use-i18n";

const Footer = () => {
  const { t, locale } = useI18n();
  const now = new Date();
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  const formattedDate = now.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const formattedTime = now.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <footer className="w-full py-4 px-6 bg-gray-100 border-t border-gray-200 text-sm text-gray-600 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        &copy; {now.getFullYear()} Łukasz Mędyk Oprogramowanie. {t("footer.allRightsReserved")}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {t("footer.contact")}: <a href="mailto:kontakt@ecurs.pl" className="underline hover:text-orange-600">kontakt@ecurs.pl</a>
        </span>
        <span className="text-gray-400">•</span>
        <Link href="/terms" className="underline hover:text-orange-600">{t("footer.terms")}</Link>
        <Link href="/privacy" className="underline hover:text-orange-600">{t("footer.privacy")}</Link>
        <a
          href="https://www.facebook.com/ecurspolska"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-orange-600"
        >
          Facebook
        </a>
      </div>
      <div>
        {formattedDate} {formattedTime}
      </div>
    </footer>
  );
};

export default Footer;