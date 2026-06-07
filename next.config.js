/** @type {import('next').NextConfig} */

// Packages that use Node.js built-ins (http, https, stream, fs, net, tls)
// and must NEVER be bundled by webpack — loaded at runtime by Node.js.
const CLOUD_EXTERNALS = [
  '@google-cloud/storage', '@google-cloud/paginator', '@google-cloud/projectify',
  '@google-cloud/promisify', '@azure/storage-blob', '@aws-sdk/client-s3',
  // Transitive deps of @google-cloud/storage that also use Node built-ins
  'agent-base', 'https-proxy-agent', 'http-proxy-agent', 'gaxios',
  'google-auth-library', 'google-gax', 'node-fetch',
];

const NODE_EXTERNALS = ['fs', 'path', 'http', 'https', 'stream', 'net', 'tls'];

const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [
      'xlsx', 'prisma', '@prisma/client', 'bcryptjs',
      ...CLOUD_EXTERNALS,
    ],
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    // Client: mark Node built-ins as false (not available).
    // Server bundles must keep normal Node resolution for fs/path/etc.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, path: false, http: false, https: false,
        stream: false, net: false, tls: false,
      };
    } else if (config.resolve?.fallback) {
      for (const mod of ['fs', 'path', 'http', 'https', 'stream', 'net', 'tls']) {
        delete config.resolve.fallback[mod];
      }
    }

    if (isServer) {
      // Server: mark cloud SDK packages as CJS externals so webpack
      // never tries to bundle them (they are loaded at runtime by Node.js).
      const existingExternals = Array.isArray(config.externals)
        ? config.externals
        : config.externals ? [config.externals] : [];

      config.externals = [
        ...existingExternals,
        ({ request }, callback) => {
          if (NODE_EXTERNALS.includes(request)) return callback(null, 'commonjs ' + request);
          const isCloudPkg = CLOUD_EXTERNALS.some(
            pkg => request === pkg || request?.startsWith(pkg + '/')
          );
          if (isCloudPkg) return callback(null, 'commonjs ' + request);
          callback();
        },
      ];
    }

    return config;
  },
};
module.exports = nextConfig;
