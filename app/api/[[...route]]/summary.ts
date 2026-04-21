/**
 * @file summary.ts
 * @description Financial Summary API endpoint that provides aggregated financial data
 * including income, expenses, remaining balance, category breakdowns, and daily
 * activity for a specified time period. Supports comparison with previous periods
 * to calculate percentage changes.
 *
 * @module api/summary
 * @requires date-fns
 * @requires drizzle-orm
 * @requires hono
 * @requires zod
 */

import { differenceInDays, parse, subDays } from "date-fns";
import { and, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import { calculatePercentageChange, fillMissingDays } from "@/lib/utils";

/**
 * @typedef {Object} FinancialData
 * @property {number} income - Total income (sum of positive transactions)
 * @property {number} expenses - Total expenses (sum of negative transactions)
 * @property {number} remaining - Net balance (income + expenses)
 */

/**
 * @typedef {Object} CategoryData
 * @property {string} name - Name of the spending category
 * @property {number} value - Total absolute amount spent in this category
 */

/**
 * @typedef {Object} DailyActivity
 * @property {Date} date - The date of the activity
 * @property {number} income - Total income for the day
 * @property {number} expenses - Total expenses for the day
 */

/**
 * @typedef {Object} SummaryResponse
 * @property {number} remainingAmount - Current period net balance
 * @property {number} remainingChange - Percentage change in balance vs last period
 * @property {number} incomeAmount - Current period total income
 * @property {number} incomeChange - Percentage change in income vs last period
 * @property {number} expensesAmount - Current period total expenses
 * @property {number} expensesChange - Percentage change in expenses vs last period
 * @property {CategoryData[]} categories - Spending breakdown by category (top 3 + "Other")
 * @property {DailyActivity[]} days - Daily income and expense activity for the period
 */

/**
 * Financial Summary API Route
 *
 * @route GET /
 * @description Retrieves a comprehensive financial summary for the authenticated user
 * within a specified date range. If no date range is provided, defaults to the
 * last 30 days. Also fetches data from the equivalent preceding period to calculate
 * percentage changes.
 *
 * @authentication Required - Uses Clerk authentication middleware
 *
 * @queryParam {string} [from] - Start date in 'yyyy-MM-dd' format (defaults to 30 days ago)
 * @queryParam {string} [to] - End date in 'yyyy-MM-dd' format (defaults to today)
 * @queryParam {string} [accountId] - Optional account ID to filter transactions
 *
 * @returns {Object} 200 - Financial summary data
 * @returns {Object} 401 - Unauthorized when user is not authenticated
 *
 * @example
 * // Request
 * GET /api/summary?from=2024-01-01&to=2024-01-31&accountId=acc_123
 *
 * // Response
 * {
 *   "data": {
 *     "remainingAmount": 1500.00,
 *     "remainingChange": 12.5,
 *     "incomeAmount": 3000.00,
 *     "incomeChange": 5.2,
 *     "expensesAmount": -1500.00,
 *     "expensesChange": -3.1,
 *     "categories": [
 *       { "name": "Food", "value": 500.00 },
 *       { "name": "Transport", "value": 300.00 },
 *       { "name": "Entertainment", "value": 200.00 },
 *       { "name": "Other", "value": 500.00 }
 *     ],
 *     "days": [
 *       { "date": "2024-01-01", "income": 1000.00, "expenses": -200.00 },
 *       ...
 *     ]
 *   }
 * }
 */
const app = new Hono().get(
  "/",
  clerkMiddleware(),
  zValidator(
    "query",
    z.object({
      /** Start date for the summary period in 'yyyy-MM-dd' format */
      from: z.string().optional(),
      /** End date for the summary period in 'yyyy-MM-dd' format */
      to: z.string().optional(),
      /** Optional account ID to filter data for a specific account */
      accountId: z.string().optional(),
    }),
  ),
  async (c) => {
    const auth = getAuth(c);

    /**
     * Verify user authentication.
     * Returns 401 if the user is not authenticated or userId is missing.
     */
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { from, to, accountId } = c.req.valid("query");

    /**
     * Set up date range for the current period.
     * If no dates are provided, defaults to the last 30 days.
     * The start and end dates are parsed from 'yyyy-MM-dd' format.
     */
    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, 30);

    const startDate = from
      ? parse(from, "yyyy-MM-dd", new Date())
      : defaultFrom;
    const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

    /**
     * Calculate the comparison period (last period) dates.
     * The last period has the same length as the current period but
     * shifted back in time by the period length.
     *
     * @example
     * // If current period is Jan 1-31 (31 days):
     * // Last period would be Dec 1-31
     */
    const periodLength = differenceInDays(endDate, startDate) + 1;
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd = subDays(endDate, periodLength);

    /**
     * Fetches aggregated financial data for a given user and date range.
     *
     * @async
     * @function fetchFinancialData
     * @param {string} userId - The authenticated user's ID
     * @param {Date} startDate - Start of the date range to query
     * @param {Date} endDate - End of the date range to query
     * @returns {Promise<FinancialData[]>} Array containing a single object with
     *                                      income, expenses, and remaining balance
     *
     * @description Executes a database query that:
     * - Sums positive transactions as income
     * - Sums negative transactions as expenses
     * - Calculates the net remaining balance
     * - Joins transactions with accounts to verify ownership
     * - Optionally filters by accountId if provided
     */
    async function fetchFinancialData(
      userId: string,
      startDate: Date,
      endDate: Date,
    ) {
      return await db
        .select({
          /** Sum of all positive transaction amounts (income) */
          income:
            sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
              Number,
            ),
          /** Sum of all negative transaction amounts (expenses) */
          expenses:
            sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
              Number,
            ),
          /** Net balance: total sum of all transactions */
          remaining: sum(transactions.amount).mapWith(Number),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(
          and(
            /** Filter by specific account if accountId is provided */
            accountId ? eq(transactions.accountId, accountId) : undefined,
            /** Ensure transactions belong to the authenticated user */
            eq(accounts.userId, userId),
            /** Filter transactions within the specified date range */
            gte(transactions.date, startDate),
            lte(transactions.date, endDate),
          ),
        );
    }

    /**
     * Fetch financial data for both the current and last periods.
     * These will be used to calculate percentage changes between periods.
     */
    const [currentPeriod] = await fetchFinancialData(
      auth.userId,
      startDate,
      endDate,
    );
    const [lastPeriod] = await fetchFinancialData(
      auth.userId,
      lastPeriodStart,
      lastPeriodEnd,
    );

    /**
     * Calculate percentage changes between current and last periods.
     * Positive values indicate growth, negative values indicate decline.
     *
     * @see calculatePercentageChange in @/lib/utils
     */
    const incomeChange = calculatePercentageChange(
      currentPeriod.income,
      lastPeriod.income,
    );
    const expensesChange = calculatePercentageChange(
      currentPeriod.expenses,
      lastPeriod.expenses,
    );
    const remainingChange = calculatePercentageChange(
      currentPeriod.remaining,
      lastPeriod.remaining,
    );

    /**
     * Fetch spending breakdown by category for the current period.
     *
     * @description Queries transactions to:
     * - Join with accounts to verify ownership
     * - Join with categories to get category names
     * - Filter only expense transactions (negative amounts)
     * - Group results by category name
     * - Order by total spending amount (ascending)
     *
     * Only negative transactions (expenses) are included in the category breakdown.
     * Amounts are converted to absolute values for display purposes.
     */
    const category = await db
      .select({
        /** Category name from the categories table */
        name: categories.name,
        /** Total absolute spending amount for this category */
        value: sql`SUM(ABS(${transactions.amount}))`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          /** Ensure transactions belong to the authenticated user */
          eq(accounts.userId, auth.userId),
          /** Only include expense transactions (negative amounts) */
          lt(transactions.amount, 0),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
        ),
      )
      .groupBy(categories.name)
      .orderBy(sql`SUM(ABS(${transactions.amount})) DESC`);

    /**
     * Process category data to show top 3 categories and group the rest as "Other".
     *
     * @description
     * - Top 3 categories are shown individually
     * - All remaining categories are summed into an "Other" category
     * - This prevents the UI from being cluttered with too many small categories
     *
     * @example
     * // If categories are: Food(500), Transport(300), Entertainment(200), Shopping(100), Utilities(50)
     * // Result: [Food(500), Transport(300), Entertainment(200), Other(150)]
     */
    const topCategories = category.slice(0, 3);
    const otherCategories = category.slice(3);
    const otherSum = otherCategories.reduce(
      (acc, category) => acc + category.value,
      0,
    );

    /** Build the final categories array, adding "Other" if there are more than 3 categories */
    const finalCategories = topCategories;
    if (otherCategories.length > 0) {
      finalCategories.push({ name: "Other", value: otherSum });
    }

    /**
     * Fetch daily transaction activity for the current period.
     *
     * @description Queries transactions grouped by date to provide a
     * day-by-day breakdown of income and expenses. This data is used
     * to render charts and graphs in the UI.
     *
     * Results are ordered by date (ascending) for chronological display.
     */
    const activeDays = await db
      .select({
        /** Transaction date */
        date: transactions.date,
        /** Total income for this day (sum of positive transactions) */
        income:
          sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
            Number,
          ),
        /** Total expenses for this day (sum of negative transactions) */
        expenses:
          sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
            Number,
          ),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          eq(accounts.userId, auth.userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
        ),
      )
      .groupBy(transactions.date)
      .orderBy(transactions.date);

    /**
     * Fill in missing days with zero values to ensure complete date coverage.
     * This ensures the chart displays a continuous timeline even when there
     * are no transactions on certain days.
     *
     * @see fillMissingDays in @/lib/utils
     */
    const days = fillMissingDays(activeDays, startDate, endDate);

    /**
     * Return the complete financial summary response.
     *
     * @returns {Object} JSON response containing:
     * - remainingAmount: Current period net balance
     * - remainingChange: Percentage change in balance vs last period
     * - incomeAmount: Current period total income
     * - incomeChange: Percentage change in income vs last period
     * - expensesAmount: Current period total expenses
     * - expensesChange: Percentage change in expenses vs last period
     * - categories: Spending breakdown (top 3 categories + "Other")
     * - days: Day-by-day income and expense activity
     */
    return c.json({
      data: {
        remainingAmount: currentPeriod.remaining,
        remainingChange,
        incomeAmount: currentPeriod.income,
        incomeChange,
        expensesAmount: currentPeriod.expenses,
        expensesChange,
        categories: finalCategories,
        days,
      },
    });
  },
);

export default app;
