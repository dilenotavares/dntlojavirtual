import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  cacheComponents: true, // Agora fica aqui fora!
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
};

export default nextConfig;