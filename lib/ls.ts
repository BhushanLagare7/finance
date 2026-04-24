import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export const setupLemonSqueezy = () =>
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });
