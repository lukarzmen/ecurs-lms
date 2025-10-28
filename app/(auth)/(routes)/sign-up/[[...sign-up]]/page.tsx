import { SignUp } from "@clerk/nextjs";

const Page = () => {
  return <SignUp afterSignOutUrl="/register" />;
};

export default Page;
