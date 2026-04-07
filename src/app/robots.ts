import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/play", "/design"] },
    sitemap: "https://bitmap.trade/sitemap.xml",
  };
}
