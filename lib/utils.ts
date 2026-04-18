import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertAmountToMilliunits(amount: number) {
  return Math.round(amount * 1000);
}

export function convertAmountFromMilliunits(amount: number) {
  return amount / 1000;
}

export const formatCurrency = (
  amount: number,
  {
    locale = "en-US",
    currency = "USD",
  }: { locale?: string; currency?: string } = {},
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};
