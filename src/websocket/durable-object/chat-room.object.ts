import {
  handleWebSocketMessage,
  initializeWebSocketConnection,
} from "../handler/websocket.handler";

export class ChatRoom implements DurableObject {
  private sessions: Map<string, WebSocket> = new Map();
  private state: DurableObjectState;
  private env: Env;
  private conversationId: string | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("conversationId");
      this.conversationId = stored as string | null;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/websocket") {
      // Kiểm tra header Upgrade để xác nhận là WebSocket
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }

      // Tạo một cặp WebSocket (client & server)
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      try {
        await this.handleSession(server, url);
        // Trả về WebSocket client để client-side kết nối
        return new Response(null, { status: 101, webSocket: client });
      } catch (err) {
        console.error("WebSocket initialization failed:", err);
        return new Response("WebSocket initialization failed", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  }

  async handleSession(socket: WebSocket, url: URL) {
    const sessionId = crypto.randomUUID();

    const conversationId = url.searchParams.get("conversationId");
    const userId = url.searchParams.get("userId");
    const businessId = url.searchParams.get("businessId");
    const isAdmin = url.searchParams.get("isAdmin") === "true";

    if (!conversationId) {
      socket.close(1008, "Missing conversationId");
      throw new Error("Missing conversationId in WebSocket URL");
    }

    try {
      socket.accept();
    } catch (err) {
      console.error("WebSocket accept error:", err);
      socket.close(1011, "WebSocket accept failed");
      throw err;
    }

    this.sessions.set(sessionId, socket);

    if (!this.conversationId) {
      this.conversationId = conversationId;
      await this.state.storage.put("conversationId", conversationId);
    }

    await initializeWebSocketConnection(socket, this.env, conversationId);

    socket.addEventListener("message", async (event) => {
      await handleWebSocketMessage(
        socket,
        event.data as string,
        this.env,
        conversationId,
        userId,
        isAdmin,
        (message: string) => this.broadcast(message)
      );
    });

    socket.addEventListener("close", () => {
      this.sessions.delete(sessionId);
      this.checkCleanup();
    });

    socket.addEventListener("error", () => {
      this.sessions.delete(sessionId);
      this.checkCleanup();
    });
  }

  broadcast(message: string) {
    for (const [id, socket] of this.sessions) {
      try {
        socket.send(message);
      } catch {
        this.sessions.delete(id);
      }
    }
  }

  async checkCleanup() {
    // Kiểm tra nếu không còn kết nối, lên lịch cleanup trong 5 phút
    if (this.sessions.size === 0) {
      const cleanupTime = Date.now() + 1000 * 60 * 5; // 5 phút nữa
      await this.state.storage.put("cleanupTime", cleanupTime);
    }
  }

  // Hàm được gọi tự động khi tới thời gian hẹn cleanup
  async alarm() {
    const cleanupTime = (await this.state.storage.get("cleanupTime")) as number;

    // Nếu chưa tới thời gian cleanup, không làm gì
    if (Date.now() < cleanupTime) return;

    // Nếu không còn kết nối nào, thực hiện cleanup
    if (this.sessions.size === 0) {
      console.log("Cleaning up ChatRoom Durable Object");
      await this.state.storage.delete("conversationId");
      await this.state.storage.delete("cleanupTime");
    }
  }
}
