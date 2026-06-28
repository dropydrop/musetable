// Dev server — sert les fichiers statiques + API
const http = require('http');
const fs = require('fs');
const path = require('path');
const apiHandler = require('./api/index.js');

const PORT = process.env.PORT || 3000;
const MIME = {
  '.html': 'text/html;charset=utf-8',
  '.js': 'application/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);

  // Essayer de servir un fichier statique
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Sinon, déléguer à l'API
  apiHandler(req, res);
});

server.listen(PORT, () => {
  console.log(`♠ MuseTable — http://localhost:${PORT}`);
});
