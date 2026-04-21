import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
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

export const LineVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer height={350} width="100%">
      <LineChart data={data}>
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
        <Line
          className="drop-shadow-sm"
          dataKey="income"
          dot={false}
          stroke="#3D82F6"
          strokeWidth={2}
        />
        <Line
          className="drop-shadow-sm"
          dataKey="expenses"
          dot={false}
          stroke="#F43F5E"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
