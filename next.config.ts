import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["bocchi.website", "*.bocchi.website"],
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default withBundleAnalyzer(nextConfig);
