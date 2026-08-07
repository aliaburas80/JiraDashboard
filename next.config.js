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

// Local dev keeps build output outside iCloud Drive — iCloud evicts files
// from the Documents folder, destroying .next chunks while the server is
// running. Hosted production builds (Hostinger and any other standard
// Next.js host) must use the conventional `.next` directory instead: hosts
// look for `.next` after `next build` and don't know about a custom name.
const DIST_DIR =
  process.env.NEXT_DIST_DIR ||
  (process.env.NODE_ENV === 'production'
    ? '.next'
    : '.next-jira-dashboard');

const nextConfig = {
  distDir: DIST_DIR,
  // The `eslint` config option was removed entirely in Next.js 16 — linting
  // is enforced as its own dedicated CI step (see .github/workflows/quality.yml
  // and product/DEVELOPER_GUIDE.md §11a), so `next build` never needed to
  // duplicate it.
  //
  // NEXT-16-UPGRADE (DEP-UPGRADE-NEXT16): `serverComponentsExternalPackages`
  // was renamed to a top-level, no-longer-experimental `serverExternalPackages`
  // in Next.js 15+.
  serverExternalPackages: [
    'xlsx', 'prisma', '@prisma/client', 'bcryptjs',
    ...CLOUD_EXTERNALS,
  ],
  experimental: {
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
    //
    // NEXT-16-UPGRADE: Next.js 16 rejects `static: 0` outright ("Number must
    // be greater than or equal to 30") — `static` now has a hard floor of 30
    // seconds; only `dynamic` can still be 0. This is a real, flagged
    // regression risk for the original 2026-07-08 bug this config exists to
    // fix: a soft navigation to the exact same dashboard URL (e.g. two
    // uploads in a row, both redirecting to `/dashboard?fresh=1`) within that
    // 30-second window could once again show stale, already-mounted data.
    // The fully correct fix is adding `export const dynamic = 'force-dynamic'`
    // to each /dashboard/* page (hinted at, never done, in the original fix)
    // so these routes stop being bucketed as "static" at all — that's a
    // broader, separately-scoped change, not bundled into this dependency
    // upgrade. See TODO-List.md `DEP-UPGRADE-NEXT16` for the follow-up.
    staleTimes: { dynamic: 0, static: 30 },
  },
  // NEXT-16-UPGRADE: Turbopack is the default bundler for both `next dev` and
  // `next build` as of v16. A project with a custom `webpack()` function (like
  // the one below, which marks cloud-storage SDKs as server-only CJS externals
  // so they're never bundled client-side) makes `next build` fail outright
  // rather than risk silently misapplying it. Deliberately opted to keep
  // Webpack for now via the `--webpack` flag in package.json's `build`/`dev`
  // scripts, rather than blind-porting this externals logic to Turbopack's
  // `turbopack.resolveAlias`/`serverExternalPackages` equivalents with no way
  // to verify real S3/Azure/GCP storage behavior in this environment. See
  // TODO-List.md `DEP-UPGRADE-NEXT16` for the follow-up Turbopack migration.
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
