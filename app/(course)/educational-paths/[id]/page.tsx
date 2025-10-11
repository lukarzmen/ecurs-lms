import React from "react";
import Link from "next/link";

const mockCourses = [
  {
    id: "1",
    name: "Podstawy programowania",
    description: "Naucz się podstaw programowania w języku JavaScript.",
    link: "/course/1"
  },
  {
    id: "2",
    name: "Zaawansowane React",
    description: "Poznaj zaawansowane techniki pracy z Reactem.",
    link: "/course/2"
  },
  {
    id: "3",
    name: "Bazy danych",
    description: "Wprowadzenie do relacyjnych baz danych i SQL.",
    link: "/course/3"
  }
];

export default function EducationalPathPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Kursy w tej ścieżce edukacyjnej</h1>
      <ul className="space-y-4">
        {mockCourses.map(course => (
          <li key={course.id} className="border rounded p-4 bg-white shadow">
            <h2 className="text-lg font-semibold mb-2">{course.name}</h2>
            <p className="mb-2 text-gray-700">{course.description}</p>
            <Link href={course.link} className="text-blue-600 hover:underline">Przejdź do kursu</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
