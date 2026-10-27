import concurrently from 'concurrently';
import net from 'node:net';

function testListen(port, host) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    try {
      server.listen(port, host, () => server.close(() => resolve(true)));
    } catch {
      resolve(false);
    }
  });
}

async function isPortAvailable(port) {
  const [ipv4, ipv6, localhost] = await Promise.all([
    testListen(port, '0.0.0.0'),
    testListen(port, '::'),
    testListen(port, '127.0.0.1')
  ]);
  return ipv4 && ipv6 && localhost;
}

async function findPort(start) {
  for (let port = start; port < start + 100; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting at ${start}`);
}

// Ensure Windows System32 is always at the front of PATH for child processes
if (process.platform === 'win32') {
  const sys32 = 'C:\\Windows\\System32';
  process.env.PATH = `${sys32};${process.env.PATH || ''}`;
  process.env.Path = process.env.PATH;
}

const [apiPort, webPort] = await Promise.all([findPort(4000), findPort(5173)]);
process.env.PORT = String(apiPort);
process.env.CLIENT_URL = `http://localhost:${webPort}`;
process.env.VITE_API_URL = `http://localhost:${apiPort}/api`;

console.log(`SafeKeep API: http://localhost:${apiPort}`);
console.log(`SafeKeep web: http://localhost:${webPort}`);

const { result } = concurrently(
  [
    { command: 'npm --prefix backend run dev', name: 'api', prefixColor: 'blue' },
    { command: `npm --prefix frontend run dev -- --port ${webPort} --strictPort`, name: 'web', prefixColor: 'green' }
  ],
  {
    killOthersOn: ['failure', 'success']
  }
);

result.then(
  () => process.exit(0),
  () => process.exit(1)
);
