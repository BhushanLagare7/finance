"use client";

import { FaPiggyBank } from "react-icons/fa";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import { useSearchParams } from "next/navigation";

import { DataCard, DataCardLoading } from "@/components/data-card";
import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { formatDateRange } from "@/lib/utils";

export const DataGrid = () => {
  const params = useSearchParams();
  const to = params.get("to") || undefined;
  const from = params.get("from") || undefined;

  const dateRangeLabel = formatDateRange({ to, from });
  const { data: summary, isLoading } = useGetSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 pb-2 mb-8 lg:grid-cols-3">
        <DataCardLoading />
        <DataCardLoading />
        <DataCardLoading />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 pb-2 mb-8 lg:grid-cols-3">
      <DataCard
        dateRange={dateRangeLabel}
        icon={FaPiggyBank}
        percentageChange={summary?.remainingChange}
        title="Remaining"
        value={summary?.remainingAmount}
      />
      <DataCard
        dateRange={dateRangeLabel}
        icon={FaArrowTrendUp}
        percentageChange={summary?.incomeChange}
        title="Income"
        value={summary?.incomeAmount}
      />
      <DataCard
        dateRange={dateRangeLabel}
        icon={FaArrowTrendDown}
        percentageChange={summary?.expensesChange}
        title="Expenses"
        value={summary?.expensesAmount}
      />
    </div>
  );
};
