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
import { connectedBanks } from "@/db/schema";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_TOKEN;
const PLAID_SECRET = process.env.PLAID_SECRET_TOKEN;

if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  throw new Error(
    "Missing PLAID_CLIENT_ID or PLAID_SECRET environment variables",
  );
}

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

const app = new Hono()
  .post("/create-link-token", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = await client.linkTokenCreate({
      user: {
        client_user_id: auth.userId,
      },
      client_name: "Finance",
      language: "en",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
    });

    return c.json({ data: token.data.link_token });
  })
  .post(
    "/exchange-public-token",
    clerkMiddleware(),
    zValidator("json", z.object({ publicToken: z.string() })),
    async (c) => {
      const auth = getAuth(c);
      const { publicToken } = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const exchange = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const [connectedBank] = await db
        .insert(connectedBanks)
        .values({
          id: createId(),
          userId: auth.userId,
          accessToken: exchange.data.access_token,
        })
        .returning();

      return c.json({ data: connectedBank });
    },
  );

export default app;
