import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignora os erros de tipo no build
    ignoreBuildErrors: true,
  },
  experimental: {
    // Reativa as funções de velocidade e cache
    cacheComponents: true,
    instantNavigationDevToolsToggle: true,
  },
};

export default nextConfig;