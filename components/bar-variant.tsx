import { format } from "date-fns";
import {
  Bar,
  BarChart,
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

export const BarVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer height={350} width="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          axisLine={false}
          dataKey="date"
          style={{ fontSize: "12px" }}
          tickFormatter={(value) => format(value, "dd MMM")}
          tickLine={false}
          tickMargin={16}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar className="drop-shadow-sm" dataKey="income" fill="#3D82F6" />
        <Bar className="drop-shadow-sm" dataKey="expenses" fill="#F43F5E" />
      </BarChart>
    </ResponsiveContainer>
  );
};
