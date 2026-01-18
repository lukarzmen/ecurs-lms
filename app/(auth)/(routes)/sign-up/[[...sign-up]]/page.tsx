"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

const Page = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");

  if (redirectUrl) {
    const postAuthUrl = `/post-auth?redirectUrl=${encodeURIComponent(redirectUrl)}`;
    return <SignUp forceRedirectUrl={postAuthUrl} fallbackRedirectUrl={postAuthUrl} />;
  }

  return (
    <SignUp
      forceRedirectUrl="/post-auth"
      fallbackRedirectUrl="/post-auth"
      afterSignOutUrl="/register"
    />
  );
};

export default Page;
