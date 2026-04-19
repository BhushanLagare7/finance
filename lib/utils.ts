/**
 * @fileoverview Utility functions for styling, currency conversion, and date handling.
 * @module utils
 */

import { type ClassValue, clsx } from "clsx";
import { eachDayOfInterval, isSameDay } from "date-fns";
import { twMerge } from "tailwind-merge";

/**
 * Merges multiple class names or conditional class values into a single
 * optimized Tailwind CSS class string.
 *
 * Combines the functionality of `clsx` for conditional class handling
 * and `tailwind-merge` for resolving Tailwind CSS class conflicts.
 *
 * @param {...ClassValue[]} inputs - One or more class values, which can be
 * strings, arrays, or objects with boolean values.
 * @returns {string} A merged and deduplicated class string.
 *
 * @example
 * // Basic usage
 * cn("text-red-500", "bg-blue-200");
 * // => "text-red-500 bg-blue-200"
 *
 * @example
 * // Resolving Tailwind conflicts
 * cn("text-red-500", "text-blue-500");
 * // => "text-blue-500" (last conflicting class wins)
 *
 * @example
 * // Conditional classes
 * cn("base-class", { "active-class": true, "inactive-class": false });
 * // => "base-class active-class"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a standard monetary amount to milliunits (thousandths of a unit).
 *
 * Milliunits are used to avoid floating-point precision issues when storing
 * and calculating monetary values. For example, $1.23 becomes 1230 milliunits.
 *
 * @param {number} amount - The monetary amount in standard units (e.g., dollars).
 * @returns {number} The equivalent amount in milliunits, rounded to the nearest integer.
 *
 * @example
 * convertAmountToMilliunits(1.23);  // => 1230
 * convertAmountToMilliunits(0.001); // => 1
 * convertAmountToMilliunits(100);   // => 100000
 */
export function convertAmountToMilliunits(amount: number) {
  return Math.round(amount * 1000);
}

/**
 * Converts a milliunit amount back to a standard monetary unit.
 *
 * This is the inverse of `convertAmountToMilliunits`, used when retrieving
 * stored milliunit values for display or calculation purposes.
 *
 * @param {number} amount - The monetary amount in milliunits.
 * @returns {number} The equivalent amount in standard units (e.g., dollars).
 *
 * @example
 * convertAmountFromMilliunits(1230);   // => 1.23
 * convertAmountFromMilliunits(1);      // => 0.001
 * convertAmountFromMilliunits(100000); // => 100
 */
export function convertAmountFromMilliunits(amount: number) {
  return amount / 1000;
}

/**
 * Formats a numeric amount as a localized currency string.
 *
 * Uses the `Intl.NumberFormat` API to produce locale-aware currency
 * formatting with a minimum of two decimal places.
 *
 * @param {number} amount - The monetary amount to format.
 * @param {Object} [options={}] - Optional formatting configuration.
 * @param {string} [options.locale="en-US"] - A BCP 47 language tag for
 * locale-specific formatting (e.g., "en-GB", "de-DE").
 * @param {string} [options.currency="USD"] - An ISO 4217 currency code
 * (e.g., "EUR", "GBP", "JPY").
 * @returns {string} The formatted currency string.
 *
 * @example
 * formatCurrency(1234.5);
 * // => "$1,234.50"
 *
 * @example
 * // Custom locale and currency
 * formatCurrency(1234.5, { locale: "de-DE", currency: "EUR" });
 * // => "1.234,50 €"
 *
 * @example
 * // British pounds
 * formatCurrency(99.9, { locale: "en-GB", currency: "GBP" });
 * // => "£99.90"
 */
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

/**
 * Calculates the percentage change between a current and a previous value.
 *
 * Handles the edge case where the previous value is zero to avoid
 * division-by-zero errors. If both values are zero, it returns 0 (no change).
 * If only the previous value is zero but current is non-zero, it returns 100
 * to indicate a full change.
 *
 * @param {number} current - The current (new) value.
 * @param {number} previous - The previous (old) value to compare against.
 * @returns {number} The percentage change from `previous` to `current`.
 * - Returns `0` if both values are equal and previous is 0.
 * - Returns `100` if previous is 0 but current is not.
 * - Otherwise, returns the standard percentage change (can be negative).
 *
 * @example
 * calculatePercentageChange(150, 100); // => 50   (50% increase)
 * calculatePercentageChange(50, 100);  // => -50  (50% decrease)
 * calculatePercentageChange(0, 0);     // => 0    (no change)
 * calculatePercentageChange(50, 0);    // => 100  (previous was zero)
 */
export const calculatePercentageChange = (
  current: number,
  previous: number,
) => {
  if (previous === 0) return previous === current ? 0 : 100;

  return ((current - previous) / previous) * 100;
};

/**
 * Fills in missing days within a date range for a transaction activity dataset.
 *
 * Given an array of days with recorded transactions and a date range, this
 * function generates an entry for every day in the range. Days without
 * recorded transactions are filled with zero values for income and expenses,
 * ensuring a continuous, gap-free dataset suitable for charting or reporting.
 *
 * @param {Array<{ date: Date; income: number; expenses: number }>} activeDays
 * - An array of days that have recorded financial activity.
 * @param {Date} startDate - The start of the date range (inclusive).
 * @param {Date} endDate - The end of the date range (inclusive).
 * @returns {Array<{ date: Date; income: number; expenses: number }>}
 * A complete array of daily entries for every day in the range.
 * Returns an empty array if `activeDays` is empty.
 *
 * @example
 * const activeDays = [
 *   { date: new Date("2024-01-01"), income: 500, expenses: 200 },
 *   { date: new Date("2024-01-03"), income: 300, expenses: 100 },
 * ];
 *
 * fillMissingDays(activeDays, new Date("2024-01-01"), new Date("2024-01-04"));
 * // => [
 * //   { date: 2024-01-01, income: 500, expenses: 200 },
 * //   { date: 2024-01-02, income: 0,   expenses: 0   }, // filled
 * //   { date: 2024-01-03, income: 300, expenses: 100 },
 * //   { date: 2024-01-04, income: 0,   expenses: 0   }, // filled
 * // ]
 */
export const fillMissingDays = (
  activeDays: { date: Date; income: number; expenses: number }[],
  startDate: Date,
  endDate: Date,
) => {
  if (activeDays.length === 0) return [];

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const transactionsByDay = allDays.map((day) => {
    const found = activeDays.find((d) => isSameDay(d.date, day));
    return found ? found : { date: day, income: 0, expenses: 0 };
  });

  return transactionsByDay;
};
