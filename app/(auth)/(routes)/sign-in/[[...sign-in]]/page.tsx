"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

const Page = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");

  if (redirectUrl) {
    const postAuthUrl = `/post-auth?redirectUrl=${encodeURIComponent(redirectUrl)}`;
    return <SignIn forceRedirectUrl={postAuthUrl} fallbackRedirectUrl={postAuthUrl} />;
  }

  return <SignIn forceRedirectUrl="/post-auth" fallbackRedirectUrl="/post-auth" />;
};

export default Page;