/**
 * @fileoverview Subscription management API routes using Hono framework.
 * Handles subscription status checks, checkout creation, and webhook processing
 * for LemonSqueezy payment integration.
 *
 * @module subscriptions
 * @requires crypto
 * @requires drizzle-orm
 * @requires hono
 * @requires @hono/clerk-auth
 * @requires @lemonsqueezy/lemonsqueezy.js
 * @requires @paralleldrive/cuid2
 */

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { createCheckout, getSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { createId } from "@paralleldrive/cuid2";

import { db } from "@/db/drizzle";
import { subscriptions } from "@/db/schema";
import { setupLemonSqueezy } from "@/lib/ls";

/**
 * Initialize LemonSqueezy SDK with required configuration.
 * Must be called before any LemonSqueezy API operations.
 */
setupLemonSqueezy();

/**
 * Hono application instance containing subscription-related routes:
 * - GET  /current  - Retrieves current user's subscription
 * - POST /checkout - Creates or retrieves checkout/portal URL
 * - POST /webhook  - Handles LemonSqueezy webhook events
 */
const app = new Hono()

  /**
   * GET /current
   * Retrieves the current authenticated user's subscription details.
   *
   * @middleware clerkMiddleware - Validates Clerk authentication token
   *
   * @returns {Promise<Response>} JSON response containing:
   *   - 200: { data: Subscription | null } - Subscription object or null if not found
   *   - 401: { error: "Unauthorized" } - When user is not authenticated
   *
   * @example
   * // Successful response with active subscription
   * {
   *   "data": {
   *     "id": "abc123",
   *     "userId": "user_xyz",
   *     "subscriptionId": "sub_123",
   *     "status": "active"
   *   }
   * }
   *
   * // Response when no subscription exists
   * { "data": null }
   */
  .get("/current", clerkMiddleware(), async (c) => {
    // Retrieve authentication context from Clerk middleware
    const auth = getAuth(c);

    // Reject request if user is not authenticated
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Query database for user's subscription record
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId));

    // Return subscription data or null if no subscription found
    return c.json({ data: subscription || null });
  })

  /**
   * POST /checkout
   * Creates a new checkout session or returns an existing subscriber's
   * customer portal URL.
   *
   * @middleware clerkMiddleware - Validates Clerk authentication token
   *
   * @requires LEMONSQUEEZY_STORE_ID - Environment variable for LS store ID
   * @requires LEMONSQUEEZY_PRODUCT_ID - Environment variable for LS product ID
   * @requires NEXT_PUBLIC_APP_URL - Environment variable for application URL
   *
   * @returns {Promise<Response>} JSON response containing:
   *   - 200: { data: string } - Checkout URL or customer portal URL
   *   - 401: { error: "Unauthorized" } - When user is not authenticated
   *   - 500: { error: "Internal server error" } - When URL generation fails
   *   - 500: { error: "Missing configuration" } - When env variables are absent
   *
   * @example
   * // New user - returns checkout URL
   * { "data": "https://checkout.lemonsqueezy.com/checkout/..." }
   *
   * // Existing subscriber - returns portal URL
   * { "data": "https://app.lemonsqueezy.com/my-orders/..." }
   */
  .post("/checkout", clerkMiddleware(), async (c) => {
    // Retrieve authentication context from Clerk middleware
    const auth = getAuth(c);

    // Reject request if user is not authenticated
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user already has an existing subscription record
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId));

    /**
     * If user already has an active subscription,
     * redirect them to the customer portal instead of checkout
     */
    if (existing?.subscriptionId) {
      // Fetch current subscription details from LemonSqueezy
      const subscription = await getSubscription(existing.subscriptionId);

      // Extract customer portal URL from subscription attributes
      const portalUrl = subscription.data?.data.attributes.urls.customer_portal;

      // Handle case where portal URL is unavailable
      if (!portalUrl) {
        return c.json({ error: "Internal server error" }, 500);
      }

      return c.json({ data: portalUrl });
    }

    /**
     * Validate required environment variables for new checkout creation.
     * These must be configured in the deployment environment.
     */
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const productId = process.env.LEMONSQUEEZY_PRODUCT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Ensure all required configuration values are present
    if (!storeId || !productId || !appUrl) {
      return c.json({ error: "Missing configuration" }, 500);
    }

    /**
     * Create a new checkout session with:
     * - Custom user_id for webhook identification
     * - Redirect URL pointing to app homepage after purchase
     */
    const checkout = await createCheckout(storeId, productId, {
      checkoutData: { custom: { user_id: auth.userId } }, // Pass userId for webhook correlation
      productOptions: { redirectUrl: `${appUrl}/` }, // Post-purchase redirect
    });

    // Extract checkout URL from LemonSqueezy response
    const checkoutUrl = checkout.data?.data.attributes.url;

    // Handle case where checkout URL generation failed
    if (!checkoutUrl) {
      return c.json({ error: "Internal server error" }, 500);
    }

    return c.json({ data: checkoutUrl });
  })

  /**
   * POST /webhook
   * Processes incoming webhook events from LemonSqueezy.
   * Validates webhook authenticity using HMAC-SHA256 signature verification
   * and handles subscription lifecycle events.
   *
   * @requires LEMONSQUEEZY_WEBHOOK_SECRET - Environment variable for webhook validation
   *
   * Supported events:
   * - subscription_created: Creates or updates subscription record in database
   * - subscription_updated: Updates existing or creates new subscription record
   *
   * @returns {Promise<Response>} JSON response containing:
   *   - 200: { message: "Webhook received" } - Successfully processed webhook
   *   - 401: { error: "Unauthorized" } - When HMAC signature validation fails
   *   - 500: { error: "Missing webhook secret" } - When webhook secret is not configured
   *
   * @example
   * // Expected webhook payload structure
   * {
   *   "meta": {
   *     "event_name": "subscription_created",
   *     "custom_data": { "user_id": "user_xyz" }
   *   },
   *   "data": {
   *     "id": "sub_123",
   *     "attributes": { "status": "active" }
   *   }
   * }
   */
  .post("/webhook", async (c) => {
    // Read raw request body for HMAC signature verification
    const text = await c.req.text();

    // Retrieve webhook secret from environment configuration
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    // Reject request if webhook secret is not configured
    if (!secret) {
      return c.json({ error: "Missing webhook secret" }, 500);
    }

    /**
     * Verify webhook authenticity using HMAC-SHA256 signature.
     * This prevents processing of forged or tampered webhook payloads.
     *
     * Process:
     * 1. Create HMAC using webhook secret
     * 2. Generate digest from raw request body
     * 3. Compare with signature provided in request header
     */
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(text).digest("hex"), "utf-8");

    // Extract the signature sent by LemonSqueezy in the request header
    const signature = Buffer.from(
      c.req.header("x-signature") as string,
      "utf-8",
    );

    /**
     * Use timing-safe comparison to prevent timing attacks.
     * Regular string comparison could leak information about the secret
     * through response time differences.
     */
    if (!crypto.timingSafeEqual(digest, signature)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Parse webhook payload after successful signature verification
    const payload = JSON.parse(text);

    // Extract relevant data from webhook payload
    const event = payload.meta.event_name; // Type of subscription event
    const subscriptionId = payload.data.id; // LemonSqueezy subscription ID
    const userId = payload.meta.custom_data.user_id; // User ID from checkout custom data
    const status = payload.data.attributes.status; // Current subscription status

    // Check for existing subscription record in database
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, subscriptionId));

    /**
     * Handle subscription_created event.
     * Updates status if subscription exists, otherwise creates new record.
     * Note: Upsert pattern handles potential duplicate webhook deliveries.
     */
    if (event === "subscription_created") {
      if (existing) {
        // Update status for existing subscription record
        await db
          .update(subscriptions)
          .set({ status })
          .where(eq(subscriptions.subscriptionId, subscriptionId));
      } else {
        // Create new subscription record with generated unique ID
        await db.insert(subscriptions).values({
          id: createId(), // Generate unique CUID2 identifier
          subscriptionId, // LemonSqueezy subscription reference
          userId, // Associated user identifier
          status, // Initial subscription status
        });
      }
    }

    /**
     * Handle subscription_updated event.
     * Uses same upsert pattern as subscription_created to ensure
     * data consistency regardless of event processing order.
     */
    if (event === "subscription_updated") {
      if (existing) {
        // Update status for existing subscription record
        await db
          .update(subscriptions)
          .set({ status })
          .where(eq(subscriptions.subscriptionId, subscriptionId));
      } else {
        // Create new subscription record if not found
        await db.insert(subscriptions).values({
          id: createId(), // Generate unique CUID2 identifier
          subscriptionId, // LemonSqueezy subscription reference
          userId, // Associated user identifier
          status, // Current subscription status
        });
      }
    }

    // Acknowledge successful webhook processing
    return c.json({ message: "Webhook received" }, 200);
  });

export default app;
