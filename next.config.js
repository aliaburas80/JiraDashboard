/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [
      'xlsx', 'prisma', '@prisma/client', 'bcryptjs',
      // Cloud SDKs — use Node.js built-ins (stream, fs, etc.) that can't be bundled
      '@google-cloud/storage', '@google-cloud/paginator', '@google-cloud/projectify',
      '@google-cloud/promisify', '@azure/storage-blob', '@aws-sdk/client-s3',
    ],
    instrumentationHook: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};
module.exports = nextConfig;
