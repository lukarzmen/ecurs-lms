// For example, place this at the bottom of your main layout or page component

import React from "react";
import Link from "next/link";

const Footer = () => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const formattedTime = now.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <footer className="w-full py-4 px-6 bg-gray-100 border-t border-gray-200 text-sm text-gray-600 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        &copy; {now.getFullYear()} Łukasz Mędyk Oprogramowanie. Wszelkie prawa zastrzeżone.
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Kontakt: <a href="mailto:kontakt@ecurs.pl" className="underline hover:text-orange-600">kontakt@ecurs.pl</a>
        </span>
        <span className="text-gray-400">•</span>
        <Link href="/terms" className="underline hover:text-orange-600">Regulamin</Link>
        <Link href="/privacy" className="underline hover:text-orange-600">Polityka Prywatności</Link>
      </div>
      <div>
        {formattedDate} {formattedTime}
      </div>
    </footer>
  );
};

export default Footer;