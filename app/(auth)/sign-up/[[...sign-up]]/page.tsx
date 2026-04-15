import Image from "next/image";

import { LoaderIcon } from "lucide-react";
import { ClerkLoaded, ClerkLoading, SignUp } from "@clerk/nextjs";

const SignUpPage = () => {
  return (
    <div className="grid grid-cols-1 min-h-screen lg:grid-cols-2">
      <div className="flex-col justify-center items-center px-4 h-full lg:flex">
        <div className="pt-16 space-y-4 text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-base text-muted-foreground">
            Log in or Create account to get back to your dashboard
          </p>
        </div>
        <div className="flex justify-center items-center mt-8">
          <ClerkLoaded>
            <SignUp />
          </ClerkLoaded>
          <ClerkLoading>
            <LoaderIcon className="animate-spin text-muted-foreground" />
          </ClerkLoading>
        </div>
      </div>
      <div className="hidden justify-center items-center h-full bg-blue-600 lg:flex">
        <Image alt="Logo" height={200} src="/logo.svg" width={200} />
      </div>
    </div>
  );
};

export default SignUpPage;
