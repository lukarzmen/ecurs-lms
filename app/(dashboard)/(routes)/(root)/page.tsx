"use client";

import { CheckCircle, Clock } from "lucide-react";
import { InfoCard } from "./_components/info-card";
import { redirect } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const user = useAuth();
  if(!user) {
    return redirect("/sign-in");
  }

  const uid = user.currentUser?.uid;
  if (!uid) {
    return redirect("/sign-in");
  }
  // const {completedCourses, coursesInProgress} = await getDashboardCourses(uid);

  return (
    <div className="min-h-screen pl-4">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard icon={Clock} label="In progress" numberOfItems={10}/>
              <InfoCard icon={CheckCircle} label="Completed" numberOfItems={1} variant="success"/>
          </div>
          {/* <CoursesList items={[...coursesInProgress, ...completedCourses]}/> */}
        </div>
    </div>
  );
}
