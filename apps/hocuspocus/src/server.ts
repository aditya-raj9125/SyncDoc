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

// Attach Hocuspocus to the HTTP server
httpServer.on('upgrade', (request, socket, head) => {
  server.handleUpgrade(request, socket, head);
});

httpServer.listen(PORT, () => {
  console.log(`[Hocuspocus] Server running on port ${PORT} (WS + Health)`);
});
