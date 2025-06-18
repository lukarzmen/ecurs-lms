// For example, place this at the bottom of your main layout or page component

import React from "react";

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
    <footer className="w-full py-4 px-6 bg-gray-100 border-t border-gray-200 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between">
      <div>
        &copy; {now.getFullYear()} Łukasz Mędyk Oprogramowanie. Wszelkie prawa zastrzeżone.
      </div>
      <div>
        Kontakt: <a href="mailto:kontakt@ecurs.pl" className="underline hover:text-orange-600">kontakt@ecurs.pl</a>
      </div>
      <div>
        {formattedDate} {formattedTime}
      </div>
    </footer>
  );
};

export default Footer;