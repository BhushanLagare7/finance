import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { CustomTooltip } from "@/components/custom-tooltip";

type Props = {
  data: {
    date: string;
    income: number;
    expenses: number;
  }[];
};

export const AreaVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer height={350} width="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <defs>
          <linearGradient id="income" x1="0" x2="0" y1="0" y2="1">
            <stop offset="2%" stopColor="#3D82F6" stopOpacity={0.8} />
            <stop offset="98%" stopColor="#3D82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenses" x1="0" x2="0" y1="0" y2="1">
            <stop offset="2%" stopColor="#F43F5E" stopOpacity={0.8} />
            <stop offset="98%" stopColor="#F43F5E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          axisLine={false}
          dataKey="date"
          style={{ fontSize: "12px" }}
          tickFormatter={(value) => format(value, "dd MMM")}
          tickLine={false}
          tickMargin={16}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          className="drop-shadow-sm"
          dataKey="income"
          fill="url(#income)"
          stackId="income"
          stroke="#3D82F6"
          strokeWidth={2}
          type="monotone"
        />
        <Area
          className="drop-shadow-sm"
          dataKey="expenses"
          fill="url(#expenses)"
          stackId="expenses"
          stroke="#F43F5E"
          strokeWidth={2}
          type="monotone"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
