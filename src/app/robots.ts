import type { MetadataRoute } from "next";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = (getSetting("site_url", "http://localhost:3000") || "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
