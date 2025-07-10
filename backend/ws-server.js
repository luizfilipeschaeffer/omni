import WebSocket from 'ws';
import http from 'http';

const PORT = process.env.PORT || 3002;

const clients = new Map(); // userId -> ws

// Servidor HTTP para healthcheck e endpoint de notificação
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/notify') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { userId, notification } = JSON.parse(body);
        const ws = clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(notification));
          res.writeHead(200);
          res.end('Notificado');
        } else {
          res.writeHead(404);
          res.end('Usuário não conectado');
        }
      } catch {
        res.writeHead(400);
        res.end('Erro de parsing');
      }
    });
  } else if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200);
    res.end('WebSocket server running');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let userId = null;
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.userId) {
        userId = data.userId;
        clients.set(userId, ws);
      }
    } catch {}
  });
  ws.on('close', () => {
    if (userId) clients.delete(userId);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
}); 