import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  allowedDevOrigins: ["bocchi.website", "*.bocchi.website"],
};

export default nextConfig;
