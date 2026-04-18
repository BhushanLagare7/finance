import { TriangleAlertIcon } from "lucide-react";

import { useOpenCategory } from "@/features/categories/hooks/use-open-category";
import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";
import { cn } from "@/lib/utils";

interface CategoryColumnProps {
  id: string;
  category: string | null;
  categoryId: string | null;
}

export const CategoryColumn = ({
  id,
  category,
  categoryId,
}: CategoryColumnProps) => {
  const { onOpen: onOpenCategory } = useOpenCategory();
  const { onOpen: onOpenTransaction } = useOpenTransaction();

  const onClick = () => {
    if (categoryId) {
      onOpenCategory(categoryId);
    } else {
      onOpenTransaction(id);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center cursor-pointer hover:underline",
        !category && "text-red-500",
      )}
      role="button"
      onClick={onClick}
    >
      {!category && <TriangleAlertIcon className="mr-2 size-4 shrink-0" />}
      {category || "Uncategorized"}
    </div>
  );
};
