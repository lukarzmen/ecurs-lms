"use client";
import { useEffect, useState } from "react";
import DataCard from "./_components/data-card";
import { useAuth } from "@clerk/nextjs";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface CourseDetail {
  id: string;
  title: string;
  usersCount: number;
  modulesCount: number;
  averageCompletionRate: string;
  mostActiveUser: string;
  lastActiveUser: string;
  lastActiveDate?: string;
}

interface AnalyticsData {
  userCount: number;
  coursesCount: number;
  modulesCount: number;
  averageCompletionRate: string;
  activeUserCount: number;
  returningUsersCount: number;
  mostPopularCourse?: string;
  newUsersLastMonth?: number;
  newCoursesLastMonth?: number;
  leastPopularCourse?: string;
  leastActiveStudent?: string;
  mostActiveStudent?: string;
  mostCoursesStudent?: string;
  coursesDetails?: CourseDetail[];
  // Educational Path Analytics
  pathUserCount?: number;
  pathsCount?: number;
  pathCoursesCount?: number;
  averagePathCompletionRate?: string;
  mostPopularPath?: string;
  leastPopularPath?: string;
  newPathUsersLastMonth?: number;
  newPathsLastMonth?: number;
  pathsDetails?: { id: string; title: string; usersCount: number; coursesCount: number; averageCompletionRate: string; }[];
}

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userCount: 0,
    coursesCount: 0,
    modulesCount: 0,
    averageCompletionRate: "0%",
    activeUserCount: 0,
    returningUsersCount: 0,
    mostPopularCourse: "???",
    newUsersLastMonth: 0,
    newCoursesLastMonth: 0,
    leastPopularCourse: "???",
    leastActiveStudent: "???",
    mostActiveStudent: "???",
    mostCoursesStudent: "???",
    coursesDetails: [],
    pathUserCount: 0,
    pathsCount: 0,
    pathCoursesCount: 0,
    averagePathCompletionRate: "0%",
    mostPopularPath: "???",
    leastPopularPath: "???",
    newPathUsersLastMonth: 0,
    newPathsLastMonth: 0,
    pathsDetails: [],
  });
  const { userId } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/analytics?userId=${userId}`,
            { cache: "no-store" }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: AnalyticsData = await response.json();
          setAnalyticsData(data);
        } catch (error) {
          console.error("Error fetching analytics:", error);
        }
      }
    };

    fetchData();
  }, [userId]);

  const {
    userCount,
    coursesCount,
    modulesCount,
    averageCompletionRate,
    activeUserCount,
    returningUsersCount,
    mostPopularCourse,
    newUsersLastMonth,
    newCoursesLastMonth,
    leastPopularCourse,
    leastActiveStudent,
    mostActiveStudent,
    mostCoursesStudent,
    coursesDetails = [],
    pathUserCount,
    pathsCount,
    pathCoursesCount,
    averagePathCompletionRate,
    mostPopularPath,
    leastPopularPath,
    newPathUsersLastMonth,
    newPathsLastMonth,
    pathsDetails = [],
  } = analyticsData;

  // Chart data
  const barData = {
    labels: [
      "Wszyscy kursanci",
      "Aktywni (7 dni)",
      "Powracający",
      "Nowi (miesiąc)",
    ],
    datasets: [
      {
        label: "Użytkownicy",
        data: [
          userCount,
          activeUserCount,
          returningUsersCount,
          newUsersLastMonth || 0,
        ],
        backgroundColor: [
          "#f97316",
          "#fbbf24",
          "#10b981",
          "#6366f1",
        ],
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: ["Wszystkie kursy", "Nowe kursy (miesiąc)"],
    datasets: [
      {
        data: [coursesCount, newCoursesLastMonth || 0],
        backgroundColor: ["#6366f1", "#fbbf24"],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 mt-6">📊 Panel analityczny nauczyciela</h1>

      {/* SECTION: Użytkownicy i Kursy (Charts) */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
            <h2 className="font-semibold mb-2">Użytkownicy</h2>
            <Bar data={barData} options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }} />
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
            <h2 className="font-semibold mb-2">Kursy</h2>
            <Doughnut data={doughnutData} options={{
              plugins: { legend: { position: "bottom" } }
            }} />
          </div>
        </div>
      </section>

      {/* SECTION: Statystyki kursów */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Statystyki kursów</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DataCard label="Liczba kursów" value={coursesCount.toString()} />
          <DataCard label="Liczba kursantów" value={userCount.toString()} />
          <DataCard label="Liczba wszystkich modułów" value={modulesCount.toString()} />
          <DataCard label="Średni procent ukończenia kursów" value={averageCompletionRate} />
          {typeof mostPopularCourse === "string" && (
            <DataCard label="Najpopularniejszy kurs" value={mostPopularCourse} />
          )}
          {typeof leastPopularCourse === "string" && (
            <DataCard label="Najmniej popularny kurs" value={leastPopularCourse} />
          )}
          {leastActiveStudent && (
            <DataCard label="Najmniej aktywny student" value={leastActiveStudent} />
          )}
          {mostActiveStudent && (
            <DataCard label="Najbardziej aktywny student" value={mostActiveStudent} />
          )}
          {mostCoursesStudent && (
            <DataCard label="Student zapisany na najwięcej kursów" value={mostCoursesStudent} />
          )}
        </div>
      </section>

      {/* SECTION: Statystyki ścieżek edukacyjnych */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Statystyki ścieżek edukacyjnych</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DataCard label="Liczba ścieżek edukacyjnych" value={pathsCount?.toString() ?? "0"} />
          <DataCard label="Liczba użytkowników ścieżek" value={pathUserCount?.toString() ?? "0"} />
          <DataCard label="Liczba kursów w ścieżkach" value={pathCoursesCount?.toString() ?? "0"} />
          <DataCard label="Średni procent ukończenia ścieżek" value={averagePathCompletionRate ?? "0%"} />
          {typeof mostPopularPath === "string" && (
            <DataCard label="Najpopularniejsza ścieżka" value={mostPopularPath} />
          )}
          {typeof leastPopularPath === "string" && (
            <DataCard label="Najmniej popularna ścieżka" value={leastPopularPath} />
          )}
          <DataCard label="Nowi użytkownicy ścieżek (miesiąc)" value={newPathUsersLastMonth?.toString() ?? "0"} />
          <DataCard label="Nowe ścieżki (miesiąc)" value={newPathsLastMonth?.toString() ?? "0"} />
        </div>
      </section>

      {/* SECTION: Szczegółowe statystyki kursów */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Szczegółowe statystyki kursów</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nazwa kursu</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Kursanci</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Moduły</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Śr. ukończenia</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Najbardziej aktywny</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Ostatnio aktywny</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Data aktywności</th>
              </tr>
            </thead>
            <tbody>
              {coursesDetails.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">Brak danych o kursach</td>
                </tr>
              ) : (
                coursesDetails.map((course) => (
                  <tr key={course.id} className="border-t hover:bg-orange-50 transition">
                    <td className="px-4 py-2 font-medium">{course.title}</td>
                    <td className="px-4 py-2">{course.usersCount}</td>
                    <td className="px-4 py-2">{course.modulesCount}</td>
                    <td className="px-4 py-2">{course.averageCompletionRate}</td>
                    <td className="px-4 py-2">{course.mostActiveUser}</td>
                    <td className="px-4 py-2">{course.lastActiveUser}</td>
                    <td className="px-4 py-2">
                      {course.lastActiveDate
                        ? new Date(course.lastActiveDate).toLocaleString("pl-PL")
                        : "Brak"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION: Szczegółowe statystyki ścieżek edukacyjnych */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Szczegółowe statystyki ścieżek edukacyjnych</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nazwa ścieżki</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Użytkownicy</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Kursy w ścieżce</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Śr. ukończenia</th>
              </tr>
            </thead>
            <tbody>
              {pathsDetails.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">Brak danych o ścieżkach edukacyjnych</td>
                </tr>
              ) : (
                pathsDetails.map((path) => (
                  <tr key={path.id} className="border-t hover:bg-orange-50 transition">
                    <td className="px-4 py-2 font-medium">{path.title}</td>
                    <td className="px-4 py-2">{path.usersCount}</td>
                    <td className="px-4 py-2">{path.coursesCount}</td>
                    <td className="px-4 py-2">{path.averageCompletionRate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-sm text-gray-500 mt-2">
        <p>
          <span className="font-semibold">Wskazówka:</span> Kliknij na kurs, aby zobaczyć szczegółowe statystyki.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
