import Link from "next/link";

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
      <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        <span className="font-medium">Błąd!</span> {message}
      </div>
      <Link
        href="/"
        className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
      >
        Wróć do strony głównej
      </Link>
    </div>
  );
}