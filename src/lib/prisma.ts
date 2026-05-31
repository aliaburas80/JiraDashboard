// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Singleton Prisma client — activate after: npm install prisma @prisma/client && npx prisma generate

// Stub export for build compatibility until prisma is installed
export const prisma: any = new Proxy({}, {
  get: (_target, prop) => {
    if (prop === 'then') return undefined; // not a Promise
    return () => Promise.reject(new Error('Prisma is not installed. Run: npm install prisma @prisma/client && npx prisma generate'));
  },
});
