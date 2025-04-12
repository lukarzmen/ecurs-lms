"use client";
import { useEffect, useState } from "react";
import DataCard from "./_components/data-card";

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState({
    userCount: 0,
    coursesCount: 0,
    modulesCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`, { cache: "no-store" });
      const data = await response.json();
      setAnalyticsData(data);
    };

    fetchData();
  }, []);

  const { userCount, coursesCount, modulesCount } = analyticsData;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DataCard label="Wszyscy użytkownicy" value={userCount.toString()}></DataCard>
        <DataCard label="Nowi użytkownicy" value={userCount.toString()}></DataCard>
        <DataCard label="Wszystkie kursy" value={coursesCount.toString()}></DataCard>
        <DataCard label="Wszystkie lekcje" value={modulesCount.toString()}></DataCard>
        <DataCard label="Średnia liczba lekcji na rozdział" value={(modulesCount / coursesCount || 0).toFixed(2)}></DataCard>
        <DataCard label="Kurs z największą liczbą studentów" value={userCount.toString()}></DataCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;
