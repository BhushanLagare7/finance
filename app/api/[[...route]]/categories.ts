/**
 * Categories API Routes
 *
 * This module defines RESTful API endpoints for managing user categories.
 * All routes are protected with Clerk authentication middleware.
 *
 * @module api/categories
 * @requires drizzle-orm - Database query builder
 * @requires hono - Web framework
 * @requires zod - Schema validation
 * @requires @hono/clerk-auth - Authentication middleware
 */

import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";

import { db } from "@/db/drizzle";
import { categories, insertCategorySchema } from "@/db/schema";

const app = new Hono()
  /**
   * GET /
   * Retrieves all categories for the authenticated user
   *
   * @route GET /api/categories
   * @middleware clerkMiddleware - Validates user authentication
   * @returns {Object} 200 - Success response with array of categories
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   *
   * @example
   * // Response format:
   * {
   *   "data": [
   *     { "id": "clh1234", "name": "Groceries" },
   *     { "id": "clh5678", "name": "Entertainment" }
   *   ]
   * }
   */
  .get("/", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    // Check if user is authenticated
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Fetch all categories belonging to the authenticated user
    const data = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .where(eq(categories.userId, auth.userId));

    return c.json({ data });
  })

  /**
   * GET /:id
   * Retrieves a specific category by ID for the authenticated user
   *
   * @route GET /api/categories/:id
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates the category ID parameter
   * @param {string} id - Category ID (path parameter)
   * @returns {Object} 200 - Success response with category data
   * @returns {Object} 400 - Bad request if category ID is missing
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   * @returns {Object} 404 - Not found if category doesn't exist
   *
   * @example
   * // Request: GET /api/categories/clh1234
   * // Response:
   * {
   *   "data": { "id": "clh1234", "name": "Groceries" }
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

      // Validate that ID is provided
      if (!id) {
        return c.json({ error: "Category ID is required" }, 400);
      }

      // Fetch category matching both userId and categoryId
      // Using array destructuring as .select() returns an array
      const [data] = await db
        .select({
          id: categories.id,
          name: categories.name,
        })
        .from(categories)
        .where(and(eq(categories.userId, auth.userId), eq(categories.id, id)));

      // Check if category was found
      if (!data) {
        return c.json({ error: "Category not found" }, 404);
      }

      return c.json({ data });
    },
  )

  /**
   * POST /
   * Creates a new category for the authenticated user
   *
   * @route POST /api/categories
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates request body against schema
   * @param {Object} body - Request body
   * @param {string} body.name - Category name
   * @returns {Object} 200 - Success response with created category
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   *
   * @example
   * // Request body:
   * { "name": "Travel" }
   *
   * // Response:
   * {
   *   "data": {
   *     "id": "clh9012",
   *     "name": "Travel",
   *     "userId": "user_abc123"
   *   }
   * }
   */
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", insertCategorySchema.pick({ name: true })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const values = c.req.valid("json");

      // Insert new category with generated ID and authenticated userId
      const [data] = await db
        .insert(categories)
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
   * Deletes multiple categories in a single operation
   *
   * @route POST /api/categories/bulk-delete
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates array of category IDs
   * @param {Object} body - Request body
   * @param {string[]} body.ids - Array of category IDs to delete
   * @returns {Object} 200 - Success response with deleted category IDs
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   *
   * @example
   * // Request body:
   * { "ids": ["clh1234", "clh5678", "clh9012"] }
   *
   * // Response:
   * {
   *   "data": [
   *     { "id": "clh1234" },
   *     { "id": "clh5678" },
   *     { "id": "clh9012" }
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

      // Delete only categories that belong to the authenticated user
      // This prevents users from deleting other users' categories
      const data = await db
        .delete(categories)
        .where(
          and(eq(categories.userId, auth.userId), inArray(categories.id, ids)),
        )
        .returning({ id: categories.id });

      return c.json({ data });
    },
  )

  /**
   * PATCH /:id
   * Updates an existing category for the authenticated user
   *
   * @route PATCH /api/categories/:id
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates path parameter and request body
   * @param {string} id - Category ID (path parameter)
   * @param {Object} body - Request body
   * @param {string} body.name - New category name
   * @returns {Object} 200 - Success response with updated category
   * @returns {Object} 400 - Bad request if category ID is missing
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   * @returns {Object} 404 - Not found if category doesn't exist
   *
   * @example
   * // Request: PATCH /api/categories/clh1234
   * // Body: { "name": "Food & Groceries" }
   *
   * // Response:
   * {
   *   "data": {
   *     "id": "clh1234",
   *     "name": "Food & Groceries",
   *     "userId": "user_abc123"
   *   }
   * }
   */
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertCategorySchema.pick({ name: true })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Category ID is required" }, 400);
      }

      const values = c.req.valid("json");

      // Update category only if it belongs to the authenticated user
      const [data] = await db
        .update(categories)
        .set(values)
        .where(and(eq(categories.userId, auth.userId), eq(categories.id, id)))
        .returning();

      // Check if any row was updated
      if (!data) {
        return c.json({ error: "Category not found" }, 404);
      }

      return c.json({ data });
    },
  )

  /**
   * DELETE /:id
   * Deletes a specific category for the authenticated user
   *
   * @route DELETE /api/categories/:id
   * @middleware clerkMiddleware - Validates user authentication
   * @middleware zValidator - Validates the category ID parameter
   * @param {string} id - Category ID (path parameter)
   * @returns {Object} 200 - Success response with deleted category ID
   * @returns {Object} 400 - Bad request if category ID is missing
   * @returns {Object} 401 - Unauthorized if user is not authenticated
   * @returns {Object} 404 - Not found if category doesn't exist
   *
   * @example
   * // Request: DELETE /api/categories/clh1234
   *
   * // Response:
   * {
   *   "data": { "id": "clh1234" }
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
        return c.json({ error: "Category ID is required" }, 400);
      }

      // Delete category only if it belongs to the authenticated user
      const [data] = await db
        .delete(categories)
        .where(and(eq(categories.userId, auth.userId), eq(categories.id, id)))
        .returning({ id: categories.id });

      // Check if any row was deleted
      if (!data) {
        return c.json({ error: "Category not found" }, 404);
      }

      return c.json({ data });
    },
  );

/**
 * Export the Hono app instance with all category routes configured
 * This will be mounted on the main application router
 */
export default app;
