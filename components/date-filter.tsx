"use client";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { format, subDays } from "date-fns";
import { ChevronDown } from "lucide-react";
import qs from "query-string";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateRange } from "@/lib/utils";

export const DateFilter = () => {
  const router = useRouter();
  const pathname = usePathname();

  const params = useSearchParams();
  const accountId = params.get("accountId");
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const defaultTo = new Date();
  const defaultFrom = subDays(defaultTo, 30);

  const paramState = {
    from: from ? new Date(from) : defaultFrom,
    to: to ? new Date(to) : defaultTo,
  };

  const [date, setDate] = useState<DateRange | undefined>(paramState);

  const pushToUrl = (dateRange: DateRange | undefined) => {
    const query = {
      from: format(dateRange?.from || defaultFrom, "yyyy-MM-dd"),
      to: format(dateRange?.to || defaultTo, "yyyy-MM-dd"),
      accountId,
    };

    const url = qs.stringifyUrl(
      {
        url: pathname,
        query,
      },
      { skipEmptyString: true, skipNull: true },
    );

    router.push(url);
  };

  const onReset = () => {
    setDate(undefined);
    pushToUrl(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="px-3 w-full h-9 font-normal text-white rounded-md border-none transition outline-none lg:w-auto bg-white/10 hover:bg-white/20 hover:text-white focus:ring-offset-0 focus:ring-transparent focus:bg-white/30"
          disabled={false}
          size="sm"
          variant="outline"
        >
          <span>{formatDateRange(paramState)}</span>
          <ChevronDown className="ml-2 opacity-50 size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-full lg:w-auto">
        <Calendar
          autoFocus
          defaultMonth={date?.from}
          disabled={false}
          mode="range"
          numberOfMonths={2}
          selected={date}
          onSelect={setDate}
        />
        <div className="flex gap-x-2 items-center p-4 w-full">
          <PopoverClose asChild>
            <Button
              className="flex-1"
              disabled={!date?.from || !date?.to}
              variant="outline"
              onClick={onReset}
            >
              Reset
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button
              className="flex-1"
              disabled={!date?.from || !date?.to}
              onClick={() => pushToUrl(date)}
            >
              Apply
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
};
