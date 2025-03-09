import { db } from "@/lib/db";
import DataCard from "./_components/data-card";

const AnalyticsPage = async () => {
  const userCount = await db.user.count();
  const coursesCount = await db.course.count();
  const modulesCount = await db.module.count();

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DataCard label="Total users" value={userCount.toString()}></DataCard>
        <DataCard label="New users" value={userCount.toString()}></DataCard>
        <DataCard label="Total courses" value={coursesCount.toString()}></DataCard>
        <DataCard label="Total lessons" value={modulesCount.toString()} ></DataCard>
        <DataCard label="Average lessons per chapter" value={(modulesCount / coursesCount).toFixed(2)}></DataCard>
        <DataCard label="Most students attended to course" value={userCount.toString()}></DataCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;
