import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SignedIn, SignedOut, SignIn, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen pl-4">
      <SignedOut>
        <div className="flex items-center justify-center">
          <SignIn />
        </div>
      </SignedOut>
      <SignedIn>Dashboard</SignedIn>
    </div>
  );
}
