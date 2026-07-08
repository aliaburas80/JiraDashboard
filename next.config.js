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

// Keep build output outside iCloud Drive — iCloud evicts files from the
// Documents folder, destroying .next chunks while the server is running.
const DIST_DIR = process.env.NEXT_DIST_DIR
  || '.next-jira-dashboard';

const nextConfig = {
  distDir: DIST_DIR,
  eslint: {
    // Linting is enforced as a dedicated CI step. Keep `next build` focused on
    // compilation so it does not duplicate the tracked legacy inline-style
    // warning backlog in GitHub Actions logs.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      'xlsx', 'prisma', '@prisma/client', 'bcryptjs',
      ...CLOUD_EXTERNALS,
    ],
    // Disable the instrumentation hook to avoid generating edge-instrumentation
    // bundles that execute eval() in a sandboxed context (causes EvalError).
    instrumentationHook: false,
    // Bug fix, 2026-07-08: every /dashboard/* page is a 'use client' page that
    // loads its data once via useEffect-on-mount (loadMetricsWithSource()).
    // None of them set `dynamic = 'force-dynamic'`, so the App Router's
    // client-side Router Cache treated them as static segments and reused the
    // already-mounted component (with its already-loaded metrics state) for
    // up to 5 minutes on any soft navigation back to a previously visited
    // dashboard route — including the redirect straight after a fresh upload.
    // The mount effect never reran, so the dashboard kept showing whatever
    // data had loaded the first time, no matter what was just uploaded.
    // Forcing both stale-time tiers to 0 makes every dashboard navigation
    // re-fetch a fresh payload and remount, so the load effect always reruns.
    staleTimes: { dynamic: 0, static: 0 },
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
