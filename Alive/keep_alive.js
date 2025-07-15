import http from 'http';
import https from 'https';

const port = process.env.PORT || 5000;

http.createServer((req, res) => {
  console.log(`[KEEPALIVE] Ping received at ${new Date().toISOString()}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
}).listen(port, () => {
  console.log(`[KEEPALIVE] Server running on port ${port}`);
});

setInterval(() => {
  https.get('https://lumina-whitelist.onrender.com', (res) => {
    console.log(`[SELF-PING] Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`[SELF-PING] Error: ${err.message}`);
  });
}, 2 * 60 * 1000);