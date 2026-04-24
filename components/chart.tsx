import { useState } from "react";

import {
  AreaChartIcon,
  BarChart3Icon,
  FileSearchIcon,
  LineChartIcon,
  LoaderIcon,
} from "lucide-react";

import { AreaVariant } from "@/components/area-variant";
import { BarVariant } from "@/components/bar-variant";
import { LineVariant } from "@/components/line-variant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";

type Props = {
  data?: {
    date: string;
    income: number;
    expenses: number;
  }[];
};

export const Chart = ({ data = [] }: Props) => {
  const [chartType, setChartType] = useState("area");
  const { shouldBlock, triggerPaywall } = usePaywall();

  const onTypeChange = (type: string) => {
    if (type !== "area" && shouldBlock) {
      triggerPaywall();
      return;
    }

    setChartType(type);
  };

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="flex justify-between space-y-2 lg:space-y-0 lg:flex-row lg:items-center">
        <CardTitle className="text-xl line-clamp-1">Transactions</CardTitle>
        <Select defaultValue={chartType} onValueChange={onTypeChange}>
          <SelectTrigger className="px-3 h-9 rounded-md lg:w-auto">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="area">
              <div className="flex items-center">
                <AreaChartIcon className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Area chart</p>
              </div>
            </SelectItem>
            <SelectItem value="line">
              <div className="flex items-center">
                <LineChartIcon className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Line chart</p>
              </div>
            </SelectItem>
            <SelectItem value="bar">
              <div className="flex items-center">
                <BarChart3Icon className="mr-2 size-4 shrink-0" />
                <p className="line-clamp-1">Bar chart</p>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col gap-y-4 items-center justify-center h-87.5 w-full">
            <FileSearchIcon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No data for this period
            </p>
          </div>
        ) : (
          <>
            {chartType === "line" && <LineVariant data={data} />}
            {chartType === "area" && <AreaVariant data={data} />}
            {chartType === "bar" && <BarVariant data={data} />}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const ChartLoading = () => {
  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader className="flex justify-between space-y-2 lg:space-y-0 lg:flex-row lg:items-center">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-full h-8 lg:w-30" />
      </CardHeader>
      <CardContent>
        <div className="h-87.5 w-full flex items-center justify-center">
          <LoaderIcon className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      </CardContent>
    </Card>
  );
};
