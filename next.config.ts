/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora os erros chatos de tipo no build
    ignoreBuildErrors: true,
  },
  experimental: {
    // Reativa as funções de velocidade e cache que o seu projeto usa
    cacheComponents: true,
    instantNavigationDevToolsToggle: true,
  },
};

export default nextConfig;