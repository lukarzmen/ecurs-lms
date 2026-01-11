"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

const Page = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");

  if (redirectUrl) {
    return <SignUp fallbackRedirectUrl={redirectUrl} />;
  }

  return <SignUp afterSignOutUrl="/register" />;
};

export default Page;
