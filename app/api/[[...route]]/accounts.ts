/**
 * Accounts API Router
 *
 * This module defines REST API endpoints for managing user accounts.
 * All routes are protected with Clerk authentication middleware.
 *
 * @module accounts
 * @requires drizzle-orm
 * @requires hono
 * @requires zod
 * @requires @hono/clerk-auth
 * @requires @hono/zod-validator
 * @requires @paralleldrive/cuid2
 */

import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";

import { db } from "@/db/drizzle";
import { accounts, insertAccountSchema } from "@/db/schema";

const app = new Hono()
  /**
   * GET /
   * Retrieves all accounts belonging to the authenticated user
   *
   * @route GET /
   * @middleware clerkMiddleware - Validates user authentication
   * @returns {Object} 200 - Array of user accounts with id and name
   * @returns {Object} 401 - Unauthorized error if user is not authenticated
   *
   * @example
   * Response: { data: [{ id: "abc123", name: "My Account" }] }
   */
  .get("/", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    // Verify user is authenticated
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Fetch all accounts for the authenticated user
    const data = await db
      .select({
        id: accounts.id,
        name: accounts.name,
      })
      .from(accounts)
      .where(eq(accounts.userId, auth.userId));

    return c.json({ data });
  })

  /**
   * GET /:id
   * Retrieves a specific account by ID for the authenticated user
   *
   * @route GET /:id
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates the account ID parameter
   * @param {string} id - Account ID (URL parameter)
   * @returns {Object} 200 - Account object with id and name
   * @returns {Object} 400 - Bad request if ID is missing
   * @returns {Object} 401 - Unauthorized error if user is not authenticated
   * @returns {Object} 404 - Not found if account doesn't exist or doesn't belong to user
   *
   * @example
   * Response: { data: { id: "abc123", name: "My Account" } }
   */
  .get(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);

      // Verify user is authenticated
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");

      // Validate required parameter
      if (!id) {
        return c.json({ error: "Account ID is required" }, 400);
      }

      // Fetch account that matches both userId and accountId (security check)
      const [data] = await db
        .select({
          id: accounts.id,
          name: accounts.name,
        })
        .from(accounts)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, id)));

      if (!data) {
        return c.json({ error: "Account not found" }, 404);
      }

      return c.json({ data });
    },
  )

  /**
   * POST /
   * Creates a new account for the authenticated user
   *
   * @route POST /
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates request body against schema
   * @param {Object} body - Request body
   * @param {string} body.name - Account name
   * @returns {Object} 200 - Created account object
   * @returns {Object} 401 - Unauthorized error if user is not authenticated
   *
   * @example
   * Request: { name: "New Account" }
   * Response: { data: { id: "abc123", name: "New Account", userId: "user_xyz" } }
   */
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", insertAccountSchema.pick({ name: true })),
    async (c) => {
      const auth = getAuth(c);

      // Verify user is authenticated
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const values = c.req.valid("json");

      // Insert new account with generated ID and authenticated userId
      const [data] = await db
        .insert(accounts)
        .values({
          id: createId(), // Generate unique CUID
          userId: auth.userId,
          ...values,
        })
        .returning();

      return c.json({ data });
    },
  )

  /**
   * POST /bulk-delete
   * Deletes multiple accounts by their IDs for the authenticated user
   *
   * @route POST /bulk-delete
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates array of account IDs
   * @param {Object} body - Request body
   * @param {string[]} body.ids - Array of account IDs to delete
   * @returns {Object} 200 - Array of deleted account IDs
   * @returns {Object} 401 - Unauthorized error if user is not authenticated
   *
   * @example
   * Request: { ids: ["abc123", "def456"] }
   * Response: { data: [{ id: "abc123" }, { id: "def456" }] }
   */
  .post(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator("json", z.object({ ids: z.array(z.string()) })),
    async (c) => {
      const auth = getAuth(c);

      // Verify user is authenticated
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { ids } = c.req.valid("json");

      // Delete only accounts that belong to the authenticated user (security check)
      const data = await db
        .delete(accounts)
        .where(and(eq(accounts.userId, auth.userId), inArray(accounts.id, ids)))
        .returning({ id: accounts.id });

      return c.json({ data });
    },
  )

  /**
   * PATCH /:id
   * Updates an existing account for the authenticated user
   *
   * @route PATCH /:id
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates account ID and request body
   * @param {string} id - Account ID (URL parameter)
   * @param {Object} body - Request body
   * @param {string} body.name - Updated account name
   * @returns {Object} 200 - Updated account object
   * @returns {Object} 400 - Bad request if ID is missing
   * @returns {Object} 401 - Unauthorized error if user is not authenticated
   * @returns {Object} 404 - Not found if account doesn't exist or doesn't belong to user
   *
   * @example
   * Request: { name: "Updated Account Name" }
   * Response: { data: { id: "abc123", name: "Updated Account Name", userId: "user_xyz" } }
   */
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertAccountSchema.pick({ name: true })),
    async (c) => {
      const auth = getAuth(c);

      // Verify user is authenticated
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");

      // Validate required parameter
      if (!id) {
        return c.json({ error: "Account ID is required" }, 400);
      }

      const values = c.req.valid("json");

      // Update only accounts that belong to the authenticated user (security check)
      const [data] = await db
        .update(accounts)
        .set(values)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, id)))
        .returning();

      if (!data) {
        return c.json({ error: "Account not found" }, 404);
      }

      return c.json({ data });
    },
  )

  /**
   * DELETE /:id
   * Deletes a specific account by ID for the authenticated user
   *
   * @route DELETE /:id
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates account ID parameter
   * @param {string} id - Account ID (URL parameter)
   * @returns {Object} 200 - Deleted account ID
   * @returns {Object} 400 - Bad request if ID is missing
   * @returns {Object} 401 - Unauthorized error if user is not authenticated
   * @returns {Object} 404 - Not found if account doesn't exist or doesn't belong to user
   *
   * @example
   * Response: { data: { id: "abc123" } }
   */
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);

      // Verify user is authenticated
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");

      // Validate required parameter
      if (!id) {
        return c.json({ error: "Account ID is required" }, 400);
      }

      // Delete only accounts that belong to the authenticated user (security check)
      const [data] = await db
        .delete(accounts)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, id)))
        .returning({ id: accounts.id });

      if (!data) {
        return c.json({ error: "Account not found" }, 404);
      }

      return c.json({ data });
    },
  );

/**
 * Export the Hono app instance with all account routes configured
 * This will be mounted on the main application router
 */
export default app;
