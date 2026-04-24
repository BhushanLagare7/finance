import { MetadataRoute } from "next";

export async function generateSitemaps() {
  // To future-proof for Google's 50,000 URL limit per sitemap
  // Here we would fetch total counts and return an array of ids.
  // For now, we return a single sitemap chunk with id 0.
  return [{ id: 0 }];
}

export default function sitemap({ id }: { id: number }): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Here you would fetch dynamic URLs based on the chunk `id`.
  // Chunking logic: e.g., fetch users/posts offset by id * 50000.

  // Static routes
  const routes = ["", "/sign-in", "/sign-up"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return [...routes];
}
