/**
 * @fileoverview Plaid Bank Integration API Routes
 *
 * This module provides API endpoints for connecting and managing bank accounts
 * through the Plaid financial services API. It handles:
 * - Retrieving connected bank information
 * - Disconnecting banks and cleaning up associated data
 * - Creating Plaid link tokens for the frontend Link flow
 * - Exchanging public tokens for access tokens and syncing financial data
 *
 * @requires drizzle-orm
 * @requires hono
 * @requires plaid
 * @requires zod
 * @requires @hono/clerk-auth
 * @requires @hono/zod-validator
 * @requires @paralleldrive/cuid2
 */

import { and, eq, isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "plaid";
import { z } from "zod";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";

import { db } from "@/db/drizzle";
import {
  accounts,
  categories,
  connectedBanks,
  transactions,
} from "@/db/schema";
import { convertAmountToMilliunits } from "@/lib/utils";

/**
 * Plaid API client configuration
 * Uses sandbox environment for development/testing
 * Credentials are loaded from environment variables for security
 *
 * @constant {Configuration}
 */
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      /** Plaid client identifier loaded from environment variables */
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_TOKEN,
      /** Plaid secret key loaded from environment variables */
      "PLAID-SECRET": process.env.PLAID_SECRET_TOKEN,
    },
  },
});

/**
 * Initialized Plaid API client instance
 * Used to make authenticated requests to Plaid's services
 *
 * @constant {PlaidApi}
 */
const client = new PlaidApi(configuration);

/**
 * Hono router instance containing all Plaid-related API endpoints
 * All routes require authentication via Clerk middleware
 *
 * @constant {Hono}
 */
const app = new Hono()

  /**
   * GET /connected-bank
   * Retrieves the connected bank information for the authenticated user
   *
   * @middleware clerkMiddleware - Ensures request is authenticated
   * @returns {Object} JSON response containing:
   *   - data: The connected bank record or null if no bank is connected
   * @throws {401} If the user is not authenticated
   *
   * @example
   * // Response when bank is connected
   * { data: { id: "xxx", userId: "user_xxx", accessToken: "access-xxx" } }
   *
   * // Response when no bank is connected
   * { data: null }
   */
  .get("/connected-bank", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Query for the user's connected bank record
    const [connectedBank] = await db
      .select()
      .from(connectedBanks)
      .where(eq(connectedBanks.userId, auth.userId));

    return c.json({ data: connectedBank || null });
  })

  /**
   * DELETE /connected-bank
   * Disconnects the user's bank and removes all associated Plaid data
   * This includes:
   * - Removing the connected bank record
   * - Deleting all accounts synced from Plaid (identified by plaidId)
   * - Deleting all categories synced from Plaid (identified by plaidId)
   *
   * @middleware clerkMiddleware - Ensures request is authenticated
   * @returns {Object} JSON response containing:
   *   - data: The deleted connected bank record
   * @throws {401} If the user is not authenticated
   * @throws {404} If no connected bank is found for the user
   *
   * @example
   * // Successful response
   * { data: { id: "xxx" } }
   */
  .delete("/connected-bank", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Remove the connected bank and retrieve its ID for the response
    const [connectedBank] = await db
      .delete(connectedBanks)
      .where(eq(connectedBanks.userId, auth.userId))
      .returning({
        id: connectedBanks.id,
      });

    if (!connectedBank) {
      return c.json({ error: "Not found" }, 404);
    }

    /**
     * Clean up all Plaid-synced accounts for this user
     * Only removes accounts with a plaidId to preserve manually created accounts
     */
    await db
      .delete(accounts)
      .where(
        and(eq(accounts.userId, auth.userId), isNotNull(accounts.plaidId)),
      );

    /**
     * Clean up all Plaid-synced categories for this user
     * Only removes categories with a plaidId to preserve manually created categories
     */
    await db
      .delete(categories)
      .where(
        and(eq(categories.userId, auth.userId), isNotNull(categories.plaidId)),
      );

    return c.json({ data: connectedBank });
  })

  /**
   * POST /create-link-token
   * Creates a Plaid Link token to initialize the Plaid Link flow on the frontend
   * The link token is a short-lived token used to authenticate the Link session
   *
   * @middleware clerkMiddleware - Ensures request is authenticated
   * @returns {Object} JSON response containing:
   *   - data: The Plaid link token string
   * @throws {401} If the user is not authenticated
   *
   * @see {@link https://plaid.com/docs/api/tokens/#linktokencreate} Plaid Link Token docs
   *
   * @example
   * // Successful response
   * { data: "link-sandbox-xxx-xxx" }
   */
  .post("/create-link-token", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    /**
     * Create a Plaid link token with the following configuration:
     * - Ties the token to the current user via their Clerk userId
     * - Requests access to Transaction data
     * - Configured for US bank accounts in English
     */
    const token = await client.linkTokenCreate({
      user: {
        client_user_id: auth.userId,
      },
      client_name: "Finance",
      language: "en",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
    });

    return c.json({ data: token.data.link_token }, 200);
  })

  /**
   * POST /exchange-public-token
   * Exchanges a Plaid public token for a permanent access token and syncs financial data
   *
   * This endpoint handles the complete initial data sync after a user connects their bank:
   * 1. Exchanges the temporary public token for a permanent access token
   * 2. Stores the connected bank record with the access token
   * 3. Syncs transactions, accounts, and categories from Plaid
   * 4. Creates corresponding records in the local database
   *
   * @middleware clerkMiddleware - Ensures request is authenticated
   * @middleware zValidator - Validates request body against schema
   *
   * @param {Object} body - Request body
   * @param {string} body.publicToken - The public token received from Plaid Link
   *
   * @returns {Object} JSON response containing:
   *   - ok: true on successful sync
   * @throws {401} If the user is not authenticated
   *
   * @see {@link https://plaid.com/docs/api/tokens/#itempublictokenexchange} Plaid Token Exchange docs
   *
   * @example
   * // Request body
   * { "publicToken": "public-sandbox-xxx" }
   *
   * // Successful response
   * { ok: true }
   */
  .post(
    "/exchange-public-token",
    clerkMiddleware(),
    zValidator(
      "json",
      /** Schema for validating the public token in the request body */
      z.object({
        publicToken: z.string(),
      }),
    ),
    async (c) => {
      const auth = getAuth(c);
      const { publicToken } = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      /**
       * Exchange the temporary public token for a permanent access token
       * The access token is used for all future API calls for this bank connection
       */
      const exchange = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      /**
       * Store the bank connection with the permanent access token
       * Returns the created record for use in subsequent queries
       */
      const [connectedBank] = await db
        .insert(connectedBanks)
        .values({
          id: createId(),
          userId: auth.userId,
          accessToken: exchange.data.access_token,
        })
        .returning();

      /**
       * Fetch initial financial data from Plaid using the new access token:
       * - plaidTransactions: Recent transaction history
       * - plaidAccounts: Bank account details
       * - plaidCategories: Available transaction categories
       */
      const plaidTransactions = await client.transactionsSync({
        access_token: connectedBank.accessToken,
      });

      const plaidAccounts = await client.accountsGet({
        access_token: connectedBank.accessToken,
      });

      const plaidCategories = await client.categoriesGet({});

      /**
       * Create local account records from Plaid account data
       * Stores the Plaid account_id as plaidId for future syncing
       */
      const newAccounts = await db
        .insert(accounts)
        .values(
          plaidAccounts.data.accounts.map((account) => ({
            id: createId(),
            name: account.name,
            plaidId: account.account_id,
            userId: auth.userId,
          })),
        )
        .returning();

      /**
       * Create local category records from Plaid category data
       * Category names are built from the hierarchy array (e.g., "Food, Restaurants")
       * Stores the Plaid category_id as plaidId for future syncing
       */
      const newCategories = await db
        .insert(categories)
        .values(
          plaidCategories.data.categories.map((category) => ({
            id: createId(),
            name: category.hierarchy.join(", "),
            plaidId: category.category_id,
            userId: auth.userId,
          })),
        )
        .returning();

      /**
       * Build transaction records by mapping Plaid transactions to local data
       * Uses reduce to:
       * 1. Match each Plaid transaction to its local account via plaidId
       * 2. Match each Plaid transaction to its local category via plaidId
       * 3. Convert the transaction amount to milliunits for storage
       * 4. Skip transactions where the matching account isn't found
       */
      const newTransactionsValues = plaidTransactions.data.added.reduce(
        (acc, transaction) => {
          /** Find the corresponding local account using Plaid's account_id */
          const account = newAccounts.find(
            (account) => account.plaidId === transaction.account_id,
          );

          /** Find the corresponding local category using Plaid's category_id */
          const category = newCategories.find(
            (category) => category.plaidId === transaction.category_id,
          );

          /**
           * Convert amount to milliunits (e.g., $10.50 -> 10500)
           * This avoids floating-point precision issues in storage
           */
          const amountInMilliunits = convertAmountToMilliunits(
            transaction.amount,
          );

          /**
           * Only create transaction record if a matching account exists
           * Uses merchant_name as primary payee, falls back to transaction name
           */
          if (account) {
            acc.push({
              id: createId(),
              amount: amountInMilliunits,
              payee: transaction.merchant_name || transaction.name,
              notes: transaction.name,
              date: new Date(transaction.date),
              accountId: account.id,
              categoryId: category?.id,
            });
          }

          return acc;
        },
        [] as (typeof transactions.$inferInsert)[],
      );

      /** Only perform the database insert if there are transactions to add */
      if (newTransactionsValues.length > 0) {
        await db.insert(transactions).values(newTransactionsValues);
      }

      return c.json({ ok: true }, 200);
    },
  );

export default app;
