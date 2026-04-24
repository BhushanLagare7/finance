/**
 * @file Main API Router Configuration
 * @description This file serves as the central routing hub for the application's REST API.
 * It initializes a Hono application instance, registers all feature-specific route modules,
 * and exports HTTP method handlers compatible with Vercel's serverless functions.
 *
 * @module api
 */

import { Hono } from "hono";
import { handle } from "hono/vercel";

// Feature-specific route modules
import accounts from "./accounts"; // Handles user account operations
import categories from "./categories"; // Handles transaction category management
import plaid from "./plaid"; // Handles Plaid banking integration
import subscriptions from "./subscriptions"; // Handles user subscription management
import summary from "./summary"; // Handles financial summary/analytics
import transactions from "./transactions"; // Handles financial transaction operations

/**
 * @constant {Hono} app
 * @description The main Hono application instance configured with a base path of "/api".
 * All registered routes will be prefixed with "/api" automatically.
 *
 * @example
 * // A route registered as "/accounts" will be accessible at "/api/accounts"
 */
const app = new Hono().basePath("/api");

/**
 * @constant routes
 * @description Registers all feature-specific route modules to their respective API endpoints.
 * Each route module handles its own set of endpoints and middleware.
 *
 * Registered Routes:
 * - `/api/accounts`      → Account management operations (CRUD)
 * - `/api/categories`    → Transaction category management (CRUD)
 * - `/api/plaid`         → Plaid banking integration endpoints
 * - `/api/subscriptions` → Subscription plan management endpoints
 * - `/api/summary`       → Financial analytics and summary endpoints
 * - `/api/transactions`  → Financial transaction management (CRUD)
 */
const routes = app
  .route("/accounts", accounts)
  .route("/categories", categories)
  .route("/plaid", plaid)
  .route("/subscriptions", subscriptions)
  .route("/summary", summary)
  .route("/transactions", transactions);

/**
 * @exports GET
 * @description Vercel-compatible serverless handler for HTTP GET requests.
 * Used to retrieve resources from the API.
 */
export const GET = handle(app);

/**
 * @exports POST
 * @description Vercel-compatible serverless handler for HTTP POST requests.
 * Used to create new resources in the API.
 */
export const POST = handle(app);

/**
 * @exports PATCH
 * @description Vercel-compatible serverless handler for HTTP PATCH requests.
 * Used to partially update existing resources in the API.
 */
export const PATCH = handle(app);

/**
 * @exports DELETE
 * @description Vercel-compatible serverless handler for HTTP DELETE requests.
 * Used to remove existing resources from the API.
 */
export const DELETE = handle(app);

/**
 * @typedef {typeof routes} AppType
 * @description Type export representing the complete application router structure.
 * Used with Hono's RPC client for end-to-end type safety between the
 * server routes and client-side API calls.
 *
 * @example
 * // Usage with Hono's RPC client for type-safe API calls
 * import { hc } from "hono/client";
 * import type { AppType } from "@/app/api/[[...route]]/route";
 *
 * const client = hc<AppType>("/");
 */
export type AppType = typeof routes;
