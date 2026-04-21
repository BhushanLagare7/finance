/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { CategoryTooltip } from "@/components/category-tooltip";
import { formatPercentage } from "@/lib/utils";

const COLORS = ["#0062FF", "#12C6FF", "#FF647F", "#FF9354"];

type Props = {
  data: {
    name: string;
    value: number;
  }[];
};

export const PieVariant = ({ data }: Props) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer height={350} width="100%">
      <PieChart>
        <Legend
          align="right"
          content={({ payload }: any) => {
            return (
              <ul className="flex flex-col space-y-2">
                {payload.map((entry: any, index: number) => (
                  <li
                    key={`item-${index}`}
                    className="flex items-center space-x-2"
                  >
                    <span
                      className="rounded-full size-2"
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="space-x-1">
                      <span className="text-sm text-muted-foreground">
                        {entry.value}
                      </span>
                      <span className="text-sm">
                        {formatPercentage(
                          total > 0 ? (entry.payload.value / total) * 100 : 0,
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            );
          }}
          iconType="circle"
          layout="horizontal"
          verticalAlign="bottom"
        />
        <Tooltip content={<CategoryTooltip />} />
        <Pie
          cx="50%"
          cy="50%"
          data={data}
          dataKey="value"
          fill="#8884d8"
          innerRadius={60}
          labelLine={false}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
