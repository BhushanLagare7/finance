/**
 * @fileoverview Database Seeding Script
 *
 * This script populates the database with initial seed data for development
 * and testing purposes. It generates realistic financial data including:
 * - Predefined categories (Food, Rent, Utilities, Clothing)
 * - Predefined accounts (Checking, Savings)
 * - Randomly generated transactions for the past 90 days
 *
 * @module seed
 * @requires date-fns
 * @requires dotenv
 * @requires drizzle-orm/neon-http
 * @requires @neondatabase/serverless
 */

import { eachDayOfInterval, format, subDays } from "date-fns";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { accounts, categories, transactions } from "@/db/schema";
import { convertAmountToMilliunits } from "@/lib/utils";

/* --------------------------------
   Environment & Database Setup
-------------------------------- */

/**
 * Load environment variables from .env.local file.
 * This must be called before accessing any process.env variables.
 */
config({ path: ".env.local" });

/**
 * Initialize Neon serverless SQL client using the database URL
 * from environment variables.
 *
 * @throws {Error} If DATABASE_URL environment variable is not set
 */
const sql = neon(process.env.DATABASE_URL!);

/**
 * Initialize Drizzle ORM instance with the Neon SQL client.
 * This provides type-safe database query capabilities.
 */
const db = drizzle(sql);

/* --------------------------------
   Seed Constants & Configuration
-------------------------------- */

/**
 * The user ID to associate with all seeded data.
 * This should correspond to a valid user in the authentication system.
 *
 * @constant {string}
 */
const SEED_USER_ID = "user_3CPBfM9A9inXwOPIrAV7J9aaVuZ";

/**
 * Predefined spending categories to seed into the database.
 * Each category is associated with the seed user and has no Plaid integration.
 *
 * @constant {Array<{id: string, name: string, userId: string, plaidId: null}>}
 */
const SEED_CATEGORIES = [
  { id: "category_1", name: "Food", userId: SEED_USER_ID, plaidId: null },
  { id: "category_2", name: "Rent", userId: SEED_USER_ID, plaidId: null },
  { id: "category_3", name: "Utilities", userId: SEED_USER_ID, plaidId: null },
  { id: "category_7", name: "Clothing", userId: SEED_USER_ID, plaidId: null },
];

/**
 * Predefined bank accounts to seed into the database.
 * Each account is associated with the seed user and has no Plaid integration.
 *
 * @constant {Array<{id: string, name: string, userId: string, plaidId: null}>}
 */
const SEED_ACCOUNTS = [
  { id: "account_1", name: "Checking", userId: SEED_USER_ID, plaidId: null },
  { id: "account_2", name: "Savings", userId: SEED_USER_ID, plaidId: null },
];

/* --------------------------------
   Date Range Configuration
-------------------------------- */

/**
 * The end date for transaction generation (current date).
 *
 * @constant {Date}
 */
const defaultTo = new Date();

/**
 * The start date for transaction generation (90 days before current date).
 * Transactions will be generated for each day in this range.
 *
 * @constant {Date}
 */
const defaultFrom = subDays(defaultTo, 90);

/**
 * Array to store all generated seed transactions before database insertion.
 * Typed to match the database schema's select type for type safety.
 *
 * @type {Array<typeof transactions.$inferSelect>}
 */
const SEED_TRANSACTIONS: (typeof transactions.$inferSelect)[] = [];

/* --------------------------------
   Transaction Generation Helpers
-------------------------------- */

/**
 * Generates a random transaction amount based on the spending category.
 * Each category has realistic min/max ranges to simulate real-world spending.
 *
 * @param {typeof categories.$inferInsert} category - The category to generate an amount for
 * @returns {number} A random amount within the category's typical range
 *
 * @example
 * // Returns a random amount between 90 and 490 for Rent
 * const amount = generateRandomAmount({ name: "Rent", ... });
 *
 * @example
 * // Returns a random amount between 10 and 40 for Food
 * const amount = generateRandomAmount({ name: "Food", ... });
 */
const generateRandomAmount = (
  category: typeof categories.$inferInsert,
): number => {
  switch (category.name) {
    case "Rent":
      // Rent is typically the largest expense (between $90 and $490)
      return Math.random() * 400 + 90;

    case "Utilities":
      // Utility bills range from $50 to $250
      return Math.random() * 200 + 50;

    case "Food":
      // Individual food purchases range from $10 to $40
      return Math.random() * 30 + 10;

    case "Transportation":
    case "Health":
      // Transportation and health expenses range from $15 to $65
      return Math.random() * 50 + 15;

    case "Entertainment":
    case "Clothing":
    case "Miscellaneous":
      // Discretionary spending ranges from $20 to $120
      return Math.random() * 100 + 20;

    default:
      // Default range for uncategorized transactions: $10 to $60
      return Math.random() * 50 + 10;
  }
};

/**
 * Generates between 1 and 4 random transactions for a given day.
 * Each transaction is randomly assigned:
 * - A category from SEED_CATEGORIES
 * - An expense/income classification (60% chance of being an expense)
 * - An amount appropriate for its category
 *
 * Generated transactions are pushed directly into SEED_TRANSACTIONS array.
 *
 * @param {Date} day - The date for which to generate transactions
 * @returns {void}
 *
 * @example
 * // Generate transactions for January 1st, 2024
 * generateTransactionsForDay(new Date('2024-01-01'));
 */
const generateTransactionsForDay = (day: Date): void => {
  // Generate a random number of transactions (1-4) for this day
  const numTransactions = Math.floor(Math.random() * 4) + 1;

  for (let i = 0; i < numTransactions; i++) {
    // Randomly select a category from available seed categories
    const category =
      SEED_CATEGORIES[Math.floor(Math.random() * SEED_CATEGORIES.length)];

    // Determine if this is an expense (60% probability) or income (40% probability)
    const isExpense = Math.random() > 0.6;

    // Generate an amount appropriate for the selected category
    const amount = generateRandomAmount(category);

    /**
     * Convert the amount to milliunits (multiply by 1000) for database storage.
     * Expenses are stored as negative values, income as positive values.
     */
    const formattedAmount = convertAmountToMilliunits(
      isExpense ? -amount : amount,
    );

    // Add the formatted transaction to the seed array
    SEED_TRANSACTIONS.push({
      id: `transaction_${format(day, "yyyy-MM-dd")}_${i}`,
      accountId: SEED_ACCOUNTS[0].id, // Using the primary (Checking) account for all transactions
      categoryId: category.id,
      date: day,
      amount: formattedAmount,
      payee: "Merchant",
      notes: "Random transaction",
    });
  }
};

/**
 * Orchestrates transaction generation for the entire date range.
 * Iterates through each day between defaultFrom and defaultTo,
 * generating random transactions for each day.
 *
 * @returns {void}
 *
 * @example
 * // Generates transactions for all days in the 90-day window
 * generateTransactions();
 */
const generateTransactions = (): void => {
  // Get an array of each day in the date range
  const days = eachDayOfInterval({ start: defaultFrom, end: defaultTo });

  // Generate transactions for each day in the interval
  days.forEach((day) => generateTransactionsForDay(day));
};

// Execute transaction generation before seeding the database
generateTransactions();

/* --------------------------------
   Main Database Seeding Function
-------------------------------- */

/**
 * Main seeding function that resets and repopulates the database.
 *
 * Execution order:
 * 1. Clear existing data (transactions → accounts → categories)
 * 2. Insert seed categories
 * 3. Insert seed accounts
 * 4. Insert generated transactions
 *
 * @async
 * @function main
 * @returns {Promise<void>}
 * @throws {Error} Logs error and exits with code 1 if any database operation fails
 *
 * @example
 * // Run the seeding script
 * main().then(() => console.log('Seeding complete'));
 */
const main = async (): Promise<void> => {
  try {
    /*
     * Reset Phase:
     * Delete in reverse dependency order to avoid foreign key constraint violations.
     * Transactions must be deleted before accounts and categories.
     */
    await db.delete(transactions).execute();
    await db.delete(accounts).execute();
    await db.delete(categories).execute();

    /*
     * Seed Phase:
     * Insert in dependency order - categories and accounts must exist
     * before transactions can reference them.
     */

    // Seed categories first (no dependencies)
    await db.insert(categories).values(SEED_CATEGORIES).execute();

    // Seed accounts second (no dependencies)
    await db.insert(accounts).values(SEED_ACCOUNTS).execute();

    // Seed transactions last (depends on both categories and accounts)
    await db.insert(transactions).values(SEED_TRANSACTIONS).execute();
  } catch (error) {
    // Log the error details and exit with a failure code
    console.error("Error during seed:", error);
    process.exit(1);
  }
};

// Execute the main seeding function
main();
