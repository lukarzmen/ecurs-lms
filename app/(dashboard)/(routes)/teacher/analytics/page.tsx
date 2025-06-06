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

interface AnalyticsData {
  userCount: number;
  coursesCount: number;
  avgUsersPerCourse: number;
  activeUserCount: number;
  bestCompletionCourse: string;
  bestCompletionRate: string;
  returningUsersCount: number;
  mostPopularCourse?: string;
  newUsersLastMonth?: number;
  newCoursesLastMonth?: number;
  leastPopularCourse?: string;
}

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userCount: 0,
    coursesCount: 0,
    avgUsersPerCourse: 0,
    activeUserCount: 0,
    bestCompletionCourse: "???",
    bestCompletionRate: "0%",
    returningUsersCount: 0,
    mostPopularCourse: "???",
    newUsersLastMonth: 0,
    newCoursesLastMonth: 0,
    leastPopularCourse: "???",
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
    avgUsersPerCourse,
    activeUserCount,
    bestCompletionCourse,
    bestCompletionRate,
    returningUsersCount,
    mostPopularCourse,
    newUsersLastMonth,
    newCoursesLastMonth,
    leastPopularCourse,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DataCard label="Średnia liczba kursantów na kurs" value={avgUsersPerCourse.toFixed(2)} />
        <DataCard label="Kurs z najwyższym procentem ukończenia" value={bestCompletionCourse} />
        <DataCard label="Procent ukończenia najlepszego kursu" value={bestCompletionRate} />
        {typeof mostPopularCourse === "string" && (
          <DataCard label="Najpopularniejszy kurs" value={mostPopularCourse} />
        )}
        {typeof leastPopularCourse === "string" && (
          <DataCard label="Najmniej popularny kurs" value={leastPopularCourse} />
        )}
      </div>
      <div className="text-sm text-gray-500">
        <p>
          <span className="font-semibold">Wskazówka:</span> Kliknij na kurs, aby zobaczyć szczegółowe statystyki.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
