import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data?: {
    name: string;
    value: number;
  }[];
};

export const RadarVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer height={350} width="100%">
      <RadarChart cx="50%" cy="50%" data={data} outerRadius="60%">
        <PolarGrid />
        <PolarAngleAxis dataKey="name" style={{ fontSize: "12px" }} />
        <PolarRadiusAxis style={{ fontSize: "12px" }} />
        <Radar
          dataKey="value"
          fill="#3D82F6"
          fillOpacity={0.6}
          stroke="#3D82F6"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};
