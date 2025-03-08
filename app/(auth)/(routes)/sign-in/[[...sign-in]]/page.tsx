"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

const Page = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");

  if (redirectUrl) {
    return <SignIn fallbackRedirectUrl={redirectUrl} />;
  }
  return <SignIn />;
};

export default Page;