/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',   // required for Docker production build
  experimental: { serverComponentsExternalPackages: ['xlsx', 'prisma', '@prisma/client', 'bcryptjs'] },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};
module.exports = nextConfig;
