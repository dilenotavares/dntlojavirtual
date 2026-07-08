/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! ATENÇÃO !!
    // Isso ignora os erros de tipo na hora do build da Vercel.
    ignoreBuildErrors: true,
  },
  // se tiver outras coisas aqui embaixo, pode manter!
};

export default nextConfig;