import Peer, { DataConnection } from 'peerjs';

export interface PeerMessage {
  type: 'join' | 'player-list' | 'start-game' | 'game-state' | 'answer' | 'next-round' | 'show-answer' | 'answer-submitted' | 'all-answered' | 'sync-state';
  payload?: any;
}

class PeerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private messageHandlers: ((message: PeerMessage, conn: DataConnection) => void)[] = [];
  private isHostMode: boolean = false;
  public roomCode: string = '';

  init(roomCode: string, isHost: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cleanup();
      
      this.roomCode = roomCode;
      this.isHostMode = isHost;
      
      const peerId = isHost 
        ? `spotiquiz-${roomCode}` 
        : `spotiquiz-${roomCode}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      console.log('Initializing peer with ID:', peerId);
      
      this.peer = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        },
        debug: 2
      });

      this.peer.on('open', (id) => {
        console.log('Peer opened with ID:', id);
        
        if (isHost) {
          resolve();
        } else {
          const hostPeerId = `spotiquiz-${roomCode}`;
          console.log('Connecting to host:', hostPeerId);
          
          const conn = this.peer!.connect(hostPeerId, { reliable: true });
          
          conn.on('open', () => {
            console.log('Connected to host!');
            this.connections.set('host', conn);
            this.setupConnectionHandlers(conn);
            resolve();
          });

          conn.on('error', (err) => {
            console.error('Connection error:', err);
            reject(new Error('Failed to connect to host'));
          });
        }
      });

      if (isHost) {
        this.peer.on('connection', (conn) => {
          console.log('Received connection from:', conn.peer);
          
          conn.on('open', () => {
            console.log('Connection opened with:', conn.peer);
            this.connections.set(conn.peer, conn);
            this.setupConnectionHandlers(conn);
          });
        });
      }

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        if (err.type === 'peer-unavailable') {
          reject(new Error('Room not found'));
        }
      });
    });
  }

  private setupConnectionHandlers(conn: DataConnection) {
    conn.on('data', (data) => {
      console.log('Received data:', data);
      const message = data as PeerMessage;
      this.messageHandlers.forEach(handler => handler(message, conn));
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
    });
  }

  onMessage(handler: (message: PeerMessage, conn: DataConnection) => void) {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: (message: PeerMessage, conn: DataConnection) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  send(message: PeerMessage, targetPeerId?: string) {
    if (targetPeerId) {
      const conn = this.connections.get(targetPeerId);
      if (conn?.open) {
        conn.send(message);
      }
    } else if (!this.isHostMode) {
      const hostConn = this.connections.get('host');
      if (hostConn?.open) {
        hostConn.send(message);
      }
    }
  }

  broadcast(message: PeerMessage) {
    console.log('Broadcasting to', this.connections.size, 'connections:', message.type);
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  cleanup() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.messageHandlers = [];
  }

  get isHost(): boolean {
    return this.isHostMode;
  }

  get connected(): boolean {
    return this.peer !== null && !this.peer.destroyed;
  }

  get connectionCount(): number {
    return this.connections.size;
  }
}

export const peerManager = new PeerManager();
