"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import GoogleSignInButton from "./__component/GoogleSigninButton";

const Page = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");

  console.log("redirectUrl", redirectUrl);


  return <GoogleSignInButton redirectUrl={redirectUrl} />; //fallbackRedirectUrl={redirectUrl}
};

export default Page;