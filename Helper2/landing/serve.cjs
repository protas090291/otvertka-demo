#!/usr/bin/env node
/**
 * Локальный сервер для сайта-презентации (landing/dist).
 * Запуск: из папки Helper2 — node landing/serve.cjs
 * Или: npm run landing (сначала сборка, затем этот скрипт).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 5175;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  urlPath = urlPath.split('?')[0];
  const filePath = path.join(DIST, path.normalize(urlPath));

  if (!filePath.startsWith(DIST)) {
    res.statusCode = 403;
    return res.end();
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.end(data);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('  Сайт-презентация запущен: ' + url);
  console.log('  Остановка: Ctrl+C');
  console.log('');

  const plat = process.platform;
  const cmd = plat === 'darwin' ? 'open' : plat === 'win32' ? 'start' : 'xdg-open';
  exec(cmd + ' ' + url, () => {});
});
