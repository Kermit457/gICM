# WebSocket Expert

> **ID:** `websocket-expert`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** None

## What This Skill Does

Master real-time communication with WebSockets and Socket.io. Build collaborative applications, live dashboards, chat systems, and real-time notifications with proper connection management and scaling.

- WebSocket server implementation with ws library
- Socket.io server and client setup
- Connection management and reconnection logic
- Room and channel patterns for multi-user apps
- Presence detection and user status
- Message queuing and delivery guarantees
- Horizontal scaling with Redis adapter
- Authentication and authorization
- Error handling and heartbeats
- React hooks for WebSocket state

## When to Use

This skill is automatically loaded when:

- **Keywords:** websocket, socket.io, real-time, ws, live, streaming, push
- **File Types:** socket.ts, ws.ts, websocket.ts
- **Directories:** /socket, /ws, /realtime

## Core Capabilities

### 1. WebSocket Server Setup

Implement a production-ready WebSocket server.

**Basic WebSocket Server with ws:**

```typescript
// src/lib/websocket/server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

interface ExtendedWebSocket extends WebSocket {
  id: string;
  userId?: string;
  isAlive: boolean;
  rooms: Set<string>;
}

interface WebSocketMessage {
  type: string;
  payload?: unknown;
  room?: string;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ExtendedWebSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupConnectionHandler();
    this.setupHeartbeat();
  }

  private setupConnectionHandler(): void {
    this.wss.on('connection', async (ws: ExtendedWebSocket, req: IncomingMessage) => {
      // Generate unique client ID
      ws.id = crypto.randomUUID();
      ws.isAlive = true;
      ws.rooms = new Set();

      // Authenticate from query params or headers
      const { query } = parse(req.url || '', true);
      const token = query.token as string || req.headers.authorization?.split(' ')[1];

      if (token) {
        try {
          const user = await this.verifyToken(token);
          ws.userId = user.id;
          this.trackUserSocket(user.id, ws.id);
        } catch (error) {
          ws.close(4001, 'Authentication failed');
          return;
        }
      }

      this.clients.set(ws.id, ws);
      console.log(`Client connected: ${ws.id}`);

      // Handle incoming messages
      ws.on('message', (data) => this.handleMessage(ws, data));

      // Handle pong for heartbeat
      ws.on('pong', () => { ws.isAlive = true; });

      // Handle disconnection
      ws.on('close', () => this.handleDisconnect(ws));

      // Send welcome message
      this.send(ws, { type: 'connected', payload: { clientId: ws.id } });
    });
  }

  private setupHeartbeat(): void {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const extWs = ws as ExtendedWebSocket;
        if (!extWs.isAlive) {
          extWs.terminate();
          return;
        }
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);
  }

  private async handleMessage(ws: ExtendedWebSocket, data: any): Promise<void> {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'join':
          this.joinRoom(ws, message.payload as string);
          break;
        case 'leave':
          this.leaveRoom(ws, message.payload as string);
          break;
        case 'message':
          if (message.room) {
            this.broadcastToRoom(message.room, message, ws.id);
          }
          break;
        case 'ping':
          this.send(ws, { type: 'pong' });
          break;
        default:
          this.emit('message', { ws, message });
      }
    } catch (error) {
      this.send(ws, { type: 'error', payload: 'Invalid message format' });
    }
  }

  private handleDisconnect(ws: ExtendedWebSocket): void {
    // Leave all rooms
    ws.rooms.forEach((room) => this.leaveRoom(ws, room));

    // Remove from user tracking
    if (ws.userId) {
      const userSockets = this.userSockets.get(ws.userId);
      if (userSockets) {
        userSockets.delete(ws.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(ws.userId);
          this.emit('userOffline', ws.userId);
        }
      }
    }

    this.clients.delete(ws.id);
    console.log(`Client disconnected: ${ws.id}`);
  }

  // Room management
  joinRoom(ws: ExtendedWebSocket, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(ws.id);
    ws.rooms.add(room);

    this.send(ws, { type: 'joined', payload: room });
    this.broadcastToRoom(room, {
      type: 'user_joined',
      payload: { clientId: ws.id, userId: ws.userId },
    }, ws.id);
  }

  leaveRoom(ws: ExtendedWebSocket, room: string): void {
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(ws.id);
      if (roomClients.size === 0) {
        this.rooms.delete(room);
      } else {
        this.broadcastToRoom(room, {
          type: 'user_left',
          payload: { clientId: ws.id, userId: ws.userId },
        });
      }
    }
    ws.rooms.delete(room);
  }

  // Messaging
  send(ws: ExtendedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: WebSocketMessage, excludeId?: string): void {
    this.clients.forEach((client) => {
      if (client.id !== excludeId) {
        this.send(client, message);
      }
    });
  }

  broadcastToRoom(room: string, message: WebSocketMessage, excludeId?: string): void {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;

    roomClients.forEach((clientId) => {
      if (clientId !== excludeId) {
        const client = this.clients.get(clientId);
        if (client) this.send(client, message);
      }
    });
  }

  sendToUser(userId: string, message: WebSocketMessage): void {
    const userSockets = this.userSockets.get(userId);
    if (!userSockets) return;

    userSockets.forEach((socketId) => {
      const client = this.clients.get(socketId);
      if (client) this.send(client, message);
    });
  }

  // Helpers
  private trackUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
      this.emit('userOnline', userId);
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private async verifyToken(token: string): Promise<{ id: string }> {
    // Implement your auth verification
    return { id: 'user-123' };
  }

  private emit(event: string, data: any): void {
    // Event emitter for external handlers
  }

  // Stats
  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      onlineUsers: this.userSockets.size,
    };
  }
}

export { WebSocketManager };
```

**Best Practices:**
- Implement heartbeat/ping-pong for connection health
- Use binary frames for large data transfers
- Authenticate on connection, not per message
- Set reasonable message size limits
- Handle backpressure for slow clients

**Gotchas:**
- WebSocket connections count against server limits
- Proxy/load balancer configuration required
- Browser limits concurrent WebSocket connections
- Memory leaks from uncleared event listeners

### 2. Socket.io Implementation

Socket.io provides fallbacks and advanced features.

**Socket.io Server:**

```typescript
// src/lib/socket/server.ts
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

interface ServerToClientEvents {
  message: (data: { content: string; sender: string; timestamp: number }) => void;
  userJoined: (data: { userId: string; username: string }) => void;
  userLeft: (data: { userId: string }) => void;
  typing: (data: { userId: string; isTyping: boolean }) => void;
  presence: (data: { online: string[] }) => void;
}

interface ClientToServerEvents {
  joinRoom: (room: string, callback: (success: boolean) => void) => void;
  leaveRoom: (room: string) => void;
  sendMessage: (data: { room: string; content: string }) => void;
  typing: (data: { room: string; isTyping: boolean }) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  userId: string;
  username: string;
}

export async function createSocketServer(httpServer: any) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Redis adapter for horizontal scaling
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
  }

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const user = await verifyToken(token);
      socket.data.userId = user.id;
      socket.data.username = user.username;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Join user's personal room for direct messages
    socket.join(`user:${socket.data.userId}`);

    // Handle room joining
    socket.on('joinRoom', async (room, callback) => {
      // Validate room access
      const canJoin = await checkRoomAccess(socket.data.userId, room);
      if (!canJoin) {
        callback(false);
        return;
      }

      socket.join(room);
      socket.to(room).emit('userJoined', {
        userId: socket.data.userId,
        username: socket.data.username,
      });

      // Send current online users
      const sockets = await io.in(room).fetchSockets();
      const online = sockets.map((s) => s.data.userId);
      socket.emit('presence', { online });

      callback(true);
    });

    // Handle room leaving
    socket.on('leaveRoom', (room) => {
      socket.leave(room);
      socket.to(room).emit('userLeft', { userId: socket.data.userId });
    });

    // Handle messages
    socket.on('sendMessage', async (data) => {
      const message = {
        content: data.content,
        sender: socket.data.userId,
        timestamp: Date.now(),
      };

      // Persist message
      await saveMessage(data.room, message);

      // Broadcast to room
      io.to(data.room).emit('message', message);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.to(data.room).emit('typing', {
        userId: socket.data.userId,
        isTyping: data.isTyping,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
}

async function verifyToken(token: string) {
  // Implement your auth
  return { id: 'user-123', username: 'john' };
}

async function checkRoomAccess(userId: string, room: string) {
  return true;
}

async function saveMessage(room: string, message: any) {
  // Save to database
}
```

**Best Practices:**
- Use Redis adapter for multi-server deployments
- Implement proper error handling middleware
- Use namespaces to separate concerns
- Validate room access before joining
- Persist important messages to database

**Gotchas:**
- Socket.io adds overhead compared to raw WebSockets
- Polling fallback increases server load
- Redis adapter requires proper pub/sub setup
- Memory usage grows with connected users

### 3. React WebSocket Hook

Create reusable hooks for WebSocket state.

**WebSocket Hook:**

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url: string;
  token?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    token,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');

    const wsUrl = token ? `${url}?token=${token}` : url;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setStatus('connected');
      reconnectAttemptsRef.current = 0;
      onOpen?.();
    };

    ws.onclose = () => {
      setStatus('disconnected');
      onClose?.();

      if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      setStatus('error');
      onError?.(error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        onMessage?.(data);
      } catch {
        setLastMessage(event.data);
        onMessage?.(event.data);
      }
    };

    wsRef.current = ws;
  }, [url, token, reconnect, reconnectInterval, maxReconnectAttempts, onOpen, onClose, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    status,
    lastMessage,
    send,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };
}
```

**Socket.io Hook:**

```typescript
// src/hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { url = '', token, autoConnect = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(url, {
      auth: { token },
      autoConnect,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [url, token, autoConnect]);

  const emit = useCallback(<T>(event: string, data?: T) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback(<T>(event: string, callback: (data: T) => void) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  }, []);

  const off = useCallback((event: string) => {
    socketRef.current?.off(event);
  }, []);

  const joinRoom = useCallback((room: string) => {
    return new Promise<boolean>((resolve) => {
      socketRef.current?.emit('joinRoom', room, resolve);
    });
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('leaveRoom', room);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
  };
}
```

**Best Practices:**
- Clean up connections on unmount
- Implement exponential backoff for reconnection
- Use refs to avoid stale closures
- Memoize callbacks to prevent re-renders
- Handle connection state in UI

**Gotchas:**
- React StrictMode causes double mount/unmount
- State updates in callbacks may be stale
- Multiple components can share one connection
- Memory leaks from event listener cleanup

### 4. Room and Presence Patterns

Implement multi-user collaborative features.

**Presence System:**

```typescript
// src/lib/socket/presence.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

interface UserPresence {
  oderId: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: number;
  metadata?: Record<string, any>;
}

class PresenceManager {
  private prefix = 'presence';
  private ttl = 60; // seconds

  async setOnline(userId: string, metadata?: Record<string, any>): Promise<void> {
    const presence: UserPresence = {
      oderId: oderId,
      status: 'online',
      lastSeen: Date.now(),
      metadata,
    };

    await redis.setex(
      `${this.prefix}:${userId}`,
      this.ttl,
      JSON.stringify(presence)
    );
  }

  async setStatus(userId: string, status: UserPresence['status']): Promise<void> {
    const key = `${this.prefix}:${userId}`;
    const data = await redis.get(key);
    if (data) {
      const presence: UserPresence = JSON.parse(data);
      presence.status = status;
      presence.lastSeen = Date.now();
      await redis.setex(key, this.ttl, JSON.stringify(presence));
    }
  }

  async heartbeat(userId: string): Promise<void> {
    const key = `${this.prefix}:${userId}`;
    await redis.expire(key, this.ttl);
  }

  async setOffline(userId: string): Promise<void> {
    await redis.del(`${this.prefix}:${userId}`);
  }

  async getPresence(userId: string): Promise<UserPresence | null> {
    const data = await redis.get(`${this.prefix}:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async getOnlineUsers(userIds: string[]): Promise<Map<string, UserPresence>> {
    if (userIds.length === 0) return new Map();

    const keys = userIds.map((id) => `${this.prefix}:${id}`);
    const results = await redis.mget(keys);

    const presenceMap = new Map<string, UserPresence>();
    results.forEach((data, index) => {
      if (data) {
        presenceMap.set(userIds[index], JSON.parse(data));
      }
    });

    return presenceMap;
  }

  async getAllOnlineUsers(): Promise<string[]> {
    const keys = await redis.keys(`${this.prefix}:*`);
    return keys.map((key) => key.replace(`${this.prefix}:`, ''));
  }
}

export const presence = new PresenceManager();
```

**Best Practices:**
- Use heartbeats with TTL for presence
- Batch presence queries for efficiency
- Consider eventual consistency for presence
- Implement away detection based on activity
- Clean up presence on disconnect

**Gotchas:**
- Network issues can cause false offline status
- High-frequency updates increase Redis load
- Presence across multiple servers needs coordination
- Browser tab switching affects activity detection

## Real-World Examples

### Example 1: Chat Application

```typescript
// src/components/chat.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
}

export function Chat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, emit, on, joinRoom, leaveRoom } = useSocket({
    token: 'user-token',
  });

  useEffect(() => {
    if (!isConnected) return;

    joinRoom(roomId);

    const unsubMessage = on<Message>('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    const unsubTyping = on<{ oderId: string; isTyping: boolean }>('typing', (data) => {
      setTyping((prev) =>
        data.isTyping
          ? [...prev.filter((id) => id !== data.userId), data.userId]
          : prev.filter((id) => id !== data.userId)
      );
    });

    return () => {
      unsubMessage();
      unsubTyping();
      leaveRoom(roomId);
    };
  }, [isConnected, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    emit('sendMessage', { room: roomId, content: input });
    setInput('');
  };

  const handleTyping = (isTyping: boolean) => {
    emit('typing', { room: roomId, isTyping });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="p-2 bg-muted rounded">
            <span className="font-bold">{msg.sender}: </span>
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typing.length > 0 && (
        <div className="px-4 text-sm text-muted-foreground">
          {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <div className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => handleTyping(true)}
          onBlur={() => handleTyping(false)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <button onClick={sendMessage} className="px-4 py-2 bg-primary text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
}
```

### Example 2: Live Dashboard Updates

```typescript
// src/components/live-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface DashboardData {
  activeUsers: number;
  revenue: number;
  orders: number;
  lastUpdated: string;
}

export function LiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  const { status, lastMessage } = useWebSocket({
    url: `${process.env.NEXT_PUBLIC_WS_URL}/dashboard`,
    token: 'dashboard-token',
    onMessage: (msg) => {
      if (msg.type === 'dashboard_update') {
        setData(msg.payload);
      }
    },
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-muted-foreground">
          {status === 'connected' ? 'Live' : 'Reconnecting...'}
        </span>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <div className="text-2xl font-bold">{data.activeUsers}</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-2xl font-bold">${data.revenue}</div>
            <div className="text-sm text-muted-foreground">Revenue</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-2xl font-bold">{data.orders}</div>
            <div className="text-sm text-muted-foreground">Orders</div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Related Skills

- **redis-expert** - Redis pub/sub for scaling
- **react-advanced** - React patterns for real-time UIs
- **nextjs-expert** - Next.js WebSocket integration
- **authentication** - Securing WebSocket connections

## Further Reading

- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [ws Library](https://github.com/websockets/ws)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [WebSocket Security](https://owasp.org/www-project-web-security-testing-guide/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
