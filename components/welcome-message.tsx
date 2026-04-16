"use client";

import { useUser } from "@clerk/nextjs";

export const WelcomeMessage = () => {
  const { user } = useUser();

  return (
    <div className="mb-4 space-y-2">
      <h2 className="text-2xl font-medium text-white lg:text-4xl">
        Welcome Back{user?.firstName ? `, ${user.firstName}` : ""} 👋
      </h2>
      <p className="text-sm text-slate-200 lg:text-base">
        This is your Financial Overview Report
      </p>
    </div>
  );
};
