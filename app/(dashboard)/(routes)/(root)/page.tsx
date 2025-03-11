import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { CoursesList } from "@/components/ui/courses-list";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { auth } from "@clerk/nextjs/server";
import { CheckCircle, Clock } from "lucide-react";
import { InfoCard } from "./_components/info-card";
import { redirect } from "next/navigation";
import {authorizeUser} from "@/hooks/use-auth";

export default async function Home() {
  const {userId, sessionId} = auth();
  if(!userId) {
    return redirect("/sign-in");
  }
  const authState = await authorizeUser(userId, sessionId);

  if (authState === 'userNotExists') {
    return redirect("/register");
  }


  const coursesInProgress = userId ? await getDashboardCourses(userId) : [];

  return (
    <div className="min-h-screen px-4 pt-4">
      <SignedOut>
      <div className="flex items-center justify-center">
        <SignIn  />
      </div>
      </SignedOut>
      <SignedIn>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard icon={Clock} label="In progress" numberOfItems={coursesInProgress.length} />
        <InfoCard icon={CheckCircle} label="Completed" numberOfItems={0} variant="success" />
        </div>
        <CoursesList items={[...coursesInProgress]} />
      </div>
      </SignedIn>
    </div>
  );
}
