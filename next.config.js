/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['xlsx', 'prisma', '@prisma/client', 'bcryptjs'],
    instrumentationHook: true,  // enables instrumentation.ts auto-restore on startup
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};
module.exports = nextConfig;
