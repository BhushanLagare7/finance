import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CategoryTooltip = ({ active, payload }: any) => {
  if (!active) return null;

  const name = payload[0].payload.name;
  const value = payload[0].value;

  return (
    <div className="overflow-hidden bg-white rounded-sm border shadow-sm">
      <div className="p-2 px-3 text-sm bg-muted text-muted-foreground">
        {name}
      </div>
      <Separator />
      <div className="p-2 px-3 space-y-1">
        <div className="flex gap-x-4 justify-between items-center">
          <div className="flex gap-x-2 items-center">
            <div className="size-1.5 bg-rose-500 rounded-full" />
            <p className="text-sm text-muted-foreground">Expenses</p>
          </div>
          <p className="text-sm font-medium text-right">
            {formatCurrency(value * -1)}
          </p>
        </div>
      </div>
    </div>
  );
};
