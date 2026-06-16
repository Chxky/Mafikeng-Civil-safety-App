/* eslint-env node */
const localtunnel = require('localtunnel');

(async () => {
  const tunnel = await localtunnel({ port: 3000 });
  console.log('TUNNEL_URL:' + tunnel.url);
  console.log('Press Ctrl+C to stop the tunnel');

  tunnel.on('close', () => {
    console.log('Tunnel closed');
    process.exit();
  });

  process.on('SIGINT', () => {
    tunnel.close();
  });
})();
