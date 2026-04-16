import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavButtonProps {
  href: string;
  label: string;
  isActive?: boolean;
}

export const NavButton = ({ href, label, isActive }: NavButtonProps) => {
  return (
    <Button
      asChild
      className={cn(
        "justify-between w-full font-normal text-white border-none transition outline-none lg:w-auto hover:bg-white/20 hover:text-white focus-visible:ring-offset-0 focus-visible:ring-transparent focus:bg-white/30",
        isActive ? "text-white bg-white/10" : "bg-transparent",
      )}
      size="sm"
      variant="outline"
    >
      <Link href={href}>
        <p>{label}</p>
      </Link>
    </Button>
  );
};
