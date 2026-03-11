/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BITMAP_INDEX_URL: process.env.BITMAP_INDEX_URL,
  },
  images: {
    domains: ["ord.bestinslot.xyz"],
  },
  async headers() {
    return [
      {
        source: "/wasm/:path*.wasm",
        headers: [{ key: "Content-Type", value: "application/wasm" }],
      },
    ];
  },
};
export default nextConfig;
