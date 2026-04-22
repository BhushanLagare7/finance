import { Suspense } from "react";

import { AccountFilter } from "@/components/account-filter";
import { DateFilter } from "@/components/date-filter";

export const Filters = () => {
  return (
    <div className="flex flex-col gap-y-2 items-center lg:flex-row lg:gap-y-0 lg:gap-x-2">
      <Suspense fallback={null}>
        <AccountFilter />
      </Suspense>
      <Suspense fallback={null}>
        <DateFilter />
      </Suspense>
    </div>
  );
};
