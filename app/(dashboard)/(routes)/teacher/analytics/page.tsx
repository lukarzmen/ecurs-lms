"use client";
import { useEffect, useState } from "react";
import DataCard from "./_components/data-card";
import { useAuth } from "@clerk/nextjs";

interface AnalyticsData {
  userCount: number;
  coursesCount: number;
  modulesCount: number;
  mostPopularCourse: string;
  newUsersLastMonth: number;
  newCoursesLastMonth: number;
  leastPopularCourse: string;
}

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userCount: 0,
    coursesCount: 0,
    modulesCount: 0,
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
          // Handle error appropriately, e.g., display an error message to the user
        }
      }
    };

    fetchData();
  }, []);

  const {
    userCount,
    coursesCount,
    mostPopularCourse,
    newUsersLastMonth,
    newCoursesLastMonth,
    leastPopularCourse,
  } = analyticsData;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DataCard label="Wszyscy kursanci" value={userCount.toString()} />
        <DataCard label="Nowi kursanci (Ostatni miesiąc)" value={newUsersLastMonth.toString()} />
        <DataCard label="Wszystkie kursy" value={coursesCount.toString()} />
        <DataCard label="Nowe kursy (Ostatni miesiąc)" value={newCoursesLastMonth.toString()} />
        <DataCard label="Najpopularniejszy kurs" value={mostPopularCourse} />
        <DataCard label="Najmniej popularny kurs" value={leastPopularCourse} />
      </div>
    </div>
  );
};

export default AnalyticsPage;
