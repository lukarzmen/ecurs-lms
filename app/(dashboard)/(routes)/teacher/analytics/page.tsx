import { db } from "@/lib/db";
import DataCard from "./_components/data-card";

const AnalyticsPage = async () => {
  const analyticsData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`);
  const { userCount, coursesCount, modulesCount } = await analyticsData.json();

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DataCard label="Wszyscy użytkownicy" value={userCount.toString()}></DataCard>
        <DataCard label="Nowi użytkownicy" value={userCount.toString()}></DataCard>
        <DataCard label="Wszystkie kursy" value={coursesCount.toString()}></DataCard>
        <DataCard label="Wszystkie lekcje" value={modulesCount.toString()} ></DataCard>
        <DataCard label="Średnia liczba lekcji na rozdział" value={(modulesCount / coursesCount).toFixed(2)}></DataCard>
        <DataCard label="Kurs z największą liczbą studentów" value={userCount.toString()}></DataCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;
