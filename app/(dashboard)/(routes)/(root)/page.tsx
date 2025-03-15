import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { CoursesList } from "@/components/ui/courses-list";
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

  if (authState.authState === 'userNotExists') {
    return redirect("/register");
  }


  const userCourses = userId ? await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/courses?userId=${userId}`).then(res => res.json()) : [];

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
        <InfoCard icon={Clock} label="In progress" numberOfItems={userCourses.length} />
        <InfoCard icon={CheckCircle} label="Completed" numberOfItems={0} variant="success" />
        </div>
        <CoursesList items={[...userCourses]} />
      </div>
      </SignedIn>
    </div>
  );
}
