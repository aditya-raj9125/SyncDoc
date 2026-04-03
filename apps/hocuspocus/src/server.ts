import 'dotenv/config';
import { Server } from '@hocuspocus/server';
import { Throttle } from '@hocuspocus/extension-throttle';
import { authenticateConnection } from './auth';
import { databaseExtension } from './persistence';

const PORT = parseInt(process.env.PORT || '1234', 10);

import { createServer } from 'http';

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      uptime: process.uptime(),
      connections: server.getConnectionsCount() 
    }));
    return;
  }
  
  // Default response for other HTTP requests
  res.writeHead(404);
  res.end();
});

const server = Server.configure({
  timeout: 30000,
  debounce: 3000,
  maxDebounce: 10000,
  quiet: false,

  extensions: [
    new Throttle({
      throttle: 15,
      banTime: 5,
    }),
    databaseExtension,
  ],

  async onAuthenticate({ token, documentName }) {
    const result = await authenticateConnection(token, documentName);
    return {
      user: result.user,
    };
  },
});

import { WebSocketServer, WebSocket } from 'ws';

const wsServer = new WebSocketServer({ noServer: true });

// Attach Hocuspocus to the HTTP server
httpServer.on('upgrade', (request, socket, head) => {
  const url = request.url || '/';
  console.log(`[Hocuspocus] Incoming upgrade request: ${url}`);
  
  wsServer.handleUpgrade(request, socket, head, (ws: WebSocket) => {
    console.log(`[Hocuspocus] Upgrade successful for: ${url}`);
    server.handleConnection(ws, request);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('--------------------------------------------------');
  console.log(`[Hocuspocus] Server is STARTING...`);
  console.log(`[Hocuspocus] Port: ${PORT}`);
  console.log(`[Hocuspocus] Health Endpoint: http://0.0.0.0:${PORT}/health`);
  console.log('--------------------------------------------------');
});

// Global error handling to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('[Hocuspocus] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Hocuspocus] Unhandled Rejection at:', promise, 'reason:', reason);
});
