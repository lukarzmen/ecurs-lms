"use client";

import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-2xl font-bold mb-4 text-orange-700">Występują chwilowe problemy. Spróbuj ponownie później.</h1>
      <Link
        href="/"
        className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
      >
        Wróć do strony głównej
      </Link>
    </div>
  );
}