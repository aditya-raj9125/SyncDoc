import 'dotenv/config';
import { Server } from '@hocuspocus/server';
import { Throttle } from '@hocuspocus/extension-throttle';
import { authenticateConnection } from './auth';
import { databaseExtension } from './persistence';

const PORT = parseInt(process.env.PORT || '1234', 10);

const server = Server.configure({
  port: PORT,
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
    // Use document-level permission checking
    const result = await authenticateConnection(token, documentName);

    return {
      user: result.user,
    };
  },

  async onConnect({ documentName, requestHeaders }) {
    console.log(`[Server] Client connecting to document: ${documentName}`);
  },

  async onDisconnect({ documentName, clientsCount }) {
    console.log(`[Server] Client disconnected from ${documentName}. Remaining: ${clientsCount}`);
  },
});

server.listen().then(() => {
  console.log(`[Hocuspocus] Server running on port ${PORT}`);
});

// Health check endpoint for Railway
import { createServer } from 'http';

const healthServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', connections: server.getConnectionsCount() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || '1235', 10);
healthServer.listen(HEALTH_PORT, () => {
  console.log(`[Hocuspocus] Health check on port ${HEALTH_PORT}`);
});
