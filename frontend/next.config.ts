import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
  experimental: {
    serverActions: {
      // Venue upload: tối đa 5 ảnh × 5MB = 25MB → đặt 30mb cho an toàn
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
