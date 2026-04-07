import { fileURLToPath } from "url";
import { dirname } from "path";
import bundleAnalyzer from "@next/bundle-analyzer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ord.bestinslot.xyz" },
    ],
  },
  async headers() {
    return [
      {
        source: "/wasm/:path*.wasm",
        headers: [{ key: "Content-Type", value: "application/wasm" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/portfolio",
        destination: "/profile",
        permanent: true,
      },
    ];
  },
};
export default withBundleAnalyzer(nextConfig);
