/** @type {import('next').NextConfig} */
const nextConfig = {
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
