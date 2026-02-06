import { createApiClient } from '../api';
import { ApiEnvelope } from '@/types/api';

interface ConsoleMessage {
  event: 'console output' | 'status' | 'stats' | 'jwt error' | 'auth success' | 'token expiring' | 'token expired';
  args: string[];
}

interface JwtResponseData {
  token: string;
  connection_string: string;
  expires_at?: number;
  server_uuid?: string;
  user_uuid?: string;
  permissions?: string[];
}

let INSTANCE_URL: string = '';

export class ConsoleClient {
  private apiClient?: ReturnType<typeof createApiClient>;
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private isNode = typeof window === 'undefined';
  private currentToken: string | null = null;
  private serverUuid: string | null = null;
  public onOutput?: (data: string) => void;
  public onConnectionChange?: (connected: boolean) => void;
  public isReady = false;

  setConfig(instanceUrl: string, authToken: string) {
    INSTANCE_URL = instanceUrl;
    this.apiClient = createApiClient(instanceUrl, authToken);
    this.isReady = true;
  }

  setServerUuid(uuid: string) {
    this.serverUuid = uuid;
  }

  private stripAnsiCodes(text: string): string {
    return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
  }

  private async fetchJwt(): Promise<{ url: string; token: string; serverUuid: string } | null> {
    if (!this.apiClient || !this.isReady || !this.serverUuid) {
      return null;
    }
    
    const jwtEndpoint = `${INSTANCE_URL}/api/user/servers/${this.serverUuid}/jwt`;
    
    try {
      const response = await this.apiClient.post<ApiEnvelope<JwtResponseData>>(jwtEndpoint, {});
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        if (!data.connection_string || !data.token || !data.server_uuid) {
          return null;
        }

        let url = data.connection_string;
        const token = data.token;
        const serverUuid = data.server_uuid;
        
        url = url.replace(/\\\\/g, '');
        
        return { url, token, serverUuid };
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  private connect(url: string, token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    
    try {
      this.ws = new WebSocket(url, undefined, {
        headers: {
          'Origin': INSTANCE_URL
        }
      });
      this.currentToken = token;

      this.ws.onopen = () => {
        this.clearReconnect();
        
        const authMessage = JSON.stringify({
          event: 'auth',
          args: [this.currentToken]
        });
        this.ws?.send(authMessage);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ConsoleMessage = JSON.parse(event.data);
          
          if (message.event === 'auth success') {
            this.onConnectionChange?.(true);
          } else if (message.event === 'console output' && message.args.length > 0) {
            const output = this.stripAnsiCodes(message.args[0]);
            if (this.isNode) {
              process.stdout.write(output);
            } else {
              this.onOutput?.(output);
            }
          } else if (message.event === 'jwt error') {
            this.onConnectionChange?.(false);
            this.scheduleReconnect();
          }
        } catch (err) {}
      };

      this.ws.onclose = (event) => {
        this.onConnectionChange?.(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        this.onConnectionChange?.(false);
      };
    } catch (err) {}
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      const data = await this.fetchJwt();
      if (data) {
        this.connect(data.url, data.token);
      }
    }, 5000);
  }

  private clearReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private startKeepAlive(): void {
    if (this.keepAliveInterval) {
      return;
    }
    this.keepAliveInterval = setInterval(async () => {
      if (!this.isConnected && this.isReady && this.serverUuid) {
        const data = await this.fetchJwt();
        if (data) {
          this.connect(data.url, data.token);
        }
      }
    }, 10000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  public async start(): Promise<void> {
    if (!this.isReady || !this.serverUuid) {
      return;
    }
    const data = await this.fetchJwt();
    if (data) {
      this.connect(data.url, data.token);
    }
    this.startKeepAlive();
  }

  public stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.clearReconnect();
    this.stopKeepAlive();
  }

  public sendCommand(command: string): void {
    if (!this.isConnected || !command.trim()) {
      return;
    }
    try {
      this.ws?.send(JSON.stringify({
        event: 'send command',
        args: [command]
      }));
    } catch (err) {}
  }

  public get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketConsoleClient = new ConsoleClient();