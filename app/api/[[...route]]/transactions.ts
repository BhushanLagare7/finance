/**
 * Transaction API Routes
 *
 * This module defines RESTful API endpoints for managing financial transactions.
 * All routes require authentication via Clerk middleware and enforce user-level
 * data isolation.
 *
 * @module transactions
 * @requires @hono/clerk-auth - Authentication middleware
 * @requires drizzle-orm - Database ORM
 * @requires zod - Schema validation
 */

import { parse, subDays } from "date-fns";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";

import { db } from "@/db/drizzle";
import {
  accounts,
  categories,
  insertTransactionSchema,
  transactions,
} from "@/db/schema";

const app = new Hono()
  /**
   * GET /
   *
   * Retrieves a list of transactions for the authenticated user with optional filtering.
   * Defaults to transactions from the last 30 days if no date range is provided.
   *
   * @route GET /
   * @auth Required - Clerk authentication
   *
   * @queryparam {string} [from] - Start date in yyyy-MM-dd format (defaults to 30 days ago)
   * @queryparam {string} [to] - End date in yyyy-MM-dd format (defaults to today)
   * @queryparam {string} [accountId] - Filter by specific account ID
   *
   * @returns {Object} 200 - Success response
   * @returns {Object[]} data - Array of transaction objects
   * @returns {string} data[].id - Transaction ID
   * @returns {Date} data[].date - Transaction date
   * @returns {string} data[].category - Category name (nullable)
   * @returns {string} data[].categoryId - Category ID (nullable)
   * @returns {string} data[].payee - Payee name
   * @returns {number} data[].amount - Transaction amount
   * @returns {string} data[].notes - Transaction notes (nullable)
   * @returns {string} data[].account - Account name
   * @returns {string} data[].accountId - Account ID
   *
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   *
   * @example
   * // GET /?from=2024-01-01&to=2024-01-31&accountId=acc_123
   * // Response:
   * {
   *   "data": [
   *     {
   *       "id": "txn_123",
   *       "date": "2024-01-15T00:00:00.000Z",
   *       "category": "Food",
   *       "categoryId": "cat_456",
   *       "payee": "Restaurant",
   *       "amount": -2500,
   *       "notes": "Lunch meeting",
   *       "account": "Checking",
   *       "accountId": "acc_123"
   *     }
   *   ]
   * }
   */
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
      }),
    ),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { from, to, accountId } = c.req.valid("query");

      // Default date range: last 30 days
      const defaultTo = new Date();
      const defaultFrom = subDays(defaultTo, 30);

      const startDate = from
        ? parse(from, "yyyy-MM-dd", new Date())
        : defaultFrom;
      const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

      const data = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          category: categories.name,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          account: accounts.name,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(accounts.userId, auth.userId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate),
          ),
        )
        .orderBy(desc(transactions.date));

      return c.json({ data });
    },
  )
  /**
   * GET /:id
   *
   * Retrieves a single transaction by ID for the authenticated user.
   *
   * @route GET /:id
   * @auth Required - Clerk authentication
   *
   * @param {string} id - Transaction ID (URL parameter)
   *
   * @returns {Object} 200 - Success response
   * @returns {Object} data - Transaction object
   * @returns {string} data.id - Transaction ID
   * @returns {Date} data.date - Transaction date
   * @returns {string} data.categoryId - Category ID (nullable)
   * @returns {string} data.payee - Payee name
   * @returns {number} data.amount - Transaction amount
   * @returns {string} data.notes - Transaction notes (nullable)
   * @returns {string} data.accountId - Account ID
   *
   * @returns {Object} 400 - Bad request if ID is missing
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   * @returns {Object} 404 - Not found if transaction doesn't exist or doesn't belong to user
   *
   * @example
   * // GET /txn_123
   * // Response:
   * {
   *   "data": {
   *     "id": "txn_123",
   *     "date": "2024-01-15T00:00:00.000Z",
   *     "categoryId": "cat_456",
   *     "payee": "Restaurant",
   *     "amount": -2500,
   *     "notes": "Lunch meeting",
   *     "accountId": "acc_123"
   *   }
   * }
   */
  .get(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");
      if (!id) {
        return c.json({ error: "Transaction ID is required" }, 400);
      }

      const [data] = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(and(eq(accounts.userId, auth.userId), eq(transactions.id, id)));

      if (!data) {
        return c.json({ error: "Transaction not found" }, 404);
      }

      return c.json({ data });
    },
  )
  /**
   * POST /
   *
   * Creates a new transaction for the authenticated user.
   *
   * @route POST /
   * @auth Required - Clerk authentication
   *
   * @bodyparam {Date} date - Transaction date
   * @bodyparam {string} accountId - Account ID (must belong to authenticated user)
   * @bodyparam {string} [categoryId] - Category ID (optional)
   * @bodyparam {string} payee - Payee name
   * @bodyparam {number} amount - Transaction amount (negative for expenses, positive for income)
   * @bodyparam {string} [notes] - Additional notes (optional)
   *
   * @returns {Object} 200 - Success response with created transaction
   * @returns {Object} data - Created transaction object
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   *
   * @example
   * // POST /
   * // Request body:
   * {
   *   "date": "2024-01-15T00:00:00.000Z",
   *   "accountId": "acc_123",
   *   "categoryId": "cat_456",
   *   "payee": "Restaurant",
   *   "amount": -2500,
   *   "notes": "Lunch meeting"
   * }
   *
   * // Response:
   * {
   *   "data": {
   *     "id": "txn_newid123",
   *     "date": "2024-01-15T00:00:00.000Z",
   *     "accountId": "acc_123",
   *     "categoryId": "cat_456",
   *     "payee": "Restaurant",
   *     "amount": -2500,
   *     "notes": "Lunch meeting"
   *   }
   * }
   */
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", insertTransactionSchema.omit({ id: true })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const values = c.req.valid("json");

      const [data] = await db
        .insert(transactions)
        .values({
          id: createId(),
          ...values,
        })
        .returning();

      return c.json({ data });
    },
  )
  /**
   * POST /bulk-delete
   *
   * Deletes multiple transactions by ID for the authenticated user.
   * Only transactions belonging to accounts owned by the user will be deleted.
   *
   * @route POST /bulk-delete
   * @auth Required - Clerk authentication
   *
   * @bodyparam {string[]} ids - Array of transaction IDs to delete
   *
   * @returns {Object} 200 - Success response
   * @returns {Object[]} data - Array of deleted transaction objects (only IDs)
   * @returns {string} data[].id - Deleted transaction ID
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   *
   * @example
   * // POST /bulk-delete
   * // Request body:
   * {
   *   "ids": ["txn_123", "txn_456", "txn_789"]
   * }
   *
   * // Response:
   * {
   *   "data": [
   *     { "id": "txn_123" },
   *     { "id": "txn_456" },
   *     { "id": "txn_789" }
   *   ]
   * }
   */
  .post(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator("json", z.object({ ids: z.array(z.string()) })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { ids } = c.req.valid("json");

      // CTE to find transactions that belong to the user's accounts
      const transactionsToDelete = db.$with("transactions_to_delete").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(
            and(
              inArray(transactions.id, ids),
              eq(accounts.userId, auth.userId),
            ),
          ),
      );

      const data = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(
          inArray(
            transactions.id,
            sql`(SELECT id FROM ${transactionsToDelete})`,
          ),
        )
        .returning({ id: transactions.id });

      return c.json({ data });
    },
  )
  /**
   * PATCH /:id
   *
   * Updates an existing transaction for the authenticated user.
   *
   * @route PATCH /:id
   * @auth Required - Clerk authentication
   *
   * @param {string} id - Transaction ID (URL parameter)
   *
   * @bodyparam {Date} [date] - Transaction date
   * @bodyparam {string} [accountId] - Account ID
   * @bodyparam {string} [categoryId] - Category ID
   * @bodyparam {string} [payee] - Payee name
   * @bodyparam {number} [amount] - Transaction amount
   * @bodyparam {string} [notes] - Additional notes
   *
   * @returns {Object} 200 - Success response with updated transaction
   * @returns {Object} data - Updated transaction object
   * @returns {Object} 400 - Bad request if ID is missing
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   * @returns {Object} 404 - Not found if transaction doesn't exist or doesn't belong to user
   *
   * @example
   * // PATCH /txn_123
   * // Request body:
   * {
   *   "amount": -3000,
   *   "notes": "Updated amount"
   * }
   *
   * // Response:
   * {
   *   "data": {
   *     "id": "txn_123",
   *     "date": "2024-01-15T00:00:00.000Z",
   *     "accountId": "acc_123",
   *     "categoryId": "cat_456",
   *     "payee": "Restaurant",
   *     "amount": -3000,
   *     "notes": "Updated amount"
   *   }
   * }
   */
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertTransactionSchema.omit({ id: true })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");
      if (!id) {
        return c.json({ error: "Transaction ID is required" }, 400);
      }

      const values = c.req.valid("json");

      // CTE to find transaction that belongs to the user's account
      const transactionsToUpdate = db.$with("transactions_to_update").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(
            and(eq(transactions.id, id), eq(accounts.userId, auth.userId)),
          ),
      );

      const [data] = await db
        .with(transactionsToUpdate)
        .update(transactions)
        .set(values)
        .where(
          inArray(
            transactions.id,
            sql`(SELECT id FROM ${transactionsToUpdate})`,
          ),
        )
        .returning();

      if (!data) {
        return c.json({ error: "Transaction not found" }, 404);
      }

      return c.json({ data });
    },
  )
  /**
   * DELETE /:id
   *
   * Deletes a single transaction by ID for the authenticated user.
   *
   * @route DELETE /:id
   * @auth Required - Clerk authentication
   *
   * @param {string} id - Transaction ID (URL parameter)
   *
   * @returns {Object} 200 - Success response with deleted transaction ID
   * @returns {Object} data - Deleted transaction object
   * @returns {string} data.id - Deleted transaction ID
   * @returns {Object} 400 - Bad request if ID is missing
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   * @returns {Object} 404 - Not found if transaction doesn't exist or doesn't belong to user
   *
   * @example
   * // DELETE /txn_123
   * // Response:
   * {
   *   "data": {
   *     "id": "txn_123"
   *   }
   * }
   */
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");
      if (!id) {
        return c.json({ error: "Transaction ID is required" }, 400);
      }

      // CTE to find transaction that belongs to the user's account
      const transactionsToDelete = db.$with("transactions_to_delete").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(
            and(eq(transactions.id, id), eq(accounts.userId, auth.userId)),
          ),
      );

      const [data] = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(
          inArray(
            transactions.id,
            sql`(SELECT id FROM ${transactionsToDelete})`,
          ),
        )
        .returning({ id: transactions.id });

      if (!data) {
        return c.json({ error: "Transaction not found" }, 404);
      }

      return c.json({ data });
    },
  );

/**
 * Export the Hono app instance with all transaction routes configured
 * This will be mounted on the main application router
 */
export default app;
