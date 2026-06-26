import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 服务器有完整 node_modules，用普通 next start 即可；
  // 不用 standalone，避免 next start 与 standalone 产物不兼容导致部署窗口期 500。
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
