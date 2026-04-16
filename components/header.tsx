import { LoaderIcon } from "lucide-react";
import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";

import { HeaderLogo } from "@/components/header-logo";
import { Navigation } from "@/components/navigation";
import { WelcomeMessage } from "@/components/welcome-message";

export const Header = () => {
  return (
    <header className="px-4 py-8 pb-36 from-blue-700 to-blue-500 bg-linear-to-b lg:px-14">
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex justify-between items-center mb-14 w-full">
          <div className="flex items-center lg:gap-x-16">
            <HeaderLogo />
            <Navigation />
          </div>
          <ClerkLoading>
            <LoaderIcon className="animate-spin size-8 text-slate-400" />
          </ClerkLoading>
          <ClerkLoaded>
            <UserButton />
          </ClerkLoaded>
        </div>
        <WelcomeMessage />
      </div>
    </header>
  );
};
