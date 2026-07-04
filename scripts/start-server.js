#!/usr/bin/env node
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Launches Next.js on the requested port, falling back to the next free
// port if it's already taken — avoids hard-failing with EADDRINUSE.

const net = require('net');
const { spawn } = require('child_process');

function findFreePort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findFreePort(port + 1));
      } else {
        reject(err);
      }
    });
    server.listen(port, () => {
      const { port: bound } = server.address();
      server.close(() => resolve(bound));
    });
  });
}

(async () => {
  const mode = process.argv[2] === 'dev' ? 'dev' : 'start';
  const requested = parseInt(process.env.PORT, 10) || 3000;
  const port = await findFreePort(requested);

  if (port !== requested) {
    console.log(`[Delivery Clarity] Port ${requested} is in use — starting on ${port} instead.`);
  }

  const nextBin = require.resolve('next/dist/bin/next');
  const child = spawn(process.execPath, [nextBin, mode, '-p', String(port)], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) },
  });

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
})();
