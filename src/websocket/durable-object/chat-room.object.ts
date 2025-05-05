import { console } from "inspector";
import { UserRole } from "../../models/enums";
import { getUserByToken } from "../../services/user.service";
import { WebSocketHandler } from "../handler/websocket.handler";

export class ChatRoom implements DurableObject {
  private sessions: Map<string, WebSocket> = new Map();
  private unreadCountMap: Map<string, number> = new Map();
  private state: DurableObjectState;
  private env: Env;
  private conversationId: string | null = null;
  private handle: WebSocketHandler;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.handle = new WebSocketHandler(this.sessions);
    // để đảm bảo đồng bộ hóa an toàn khi khởi tạo
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("conversationId");
      this.conversationId = stored as string | null;
      const unreadCountStored = await this.state.storage.get("unreadCountMap");
      if (unreadCountStored) {
        this.unreadCountMap = new Map(
          Object.entries(unreadCountStored as Record<string, number>)
        );
      }
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
        const token = url.searchParams.get("token");
        await this.handleSession(server, url, token);
        return new Response(null, { status: 101, webSocket: client });
      } catch (err) {
        console.error("WebSocket initialization failed:", err);
        return new Response("WebSocket initialization failed", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  }

  async handleSession(socket: WebSocket, url: URL, token: string) {
    const user = await getUserByToken(this.env, token);
    console.log("User from token:", url);
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    const conversationId = url.searchParams.get("conversationId");
    const userId = user.id;
    const isAdmin = user.role === UserRole.ADMIN;

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

    // Trong handleSession của ChatRoom
    const identifier = isAdmin ? `admin:${userId}` : `client:${userId}`;
    const businessId = url.searchParams.get("businessId");

    this.sessions.set(identifier, socket);
    console.log("Sessions after adding:", [...this.sessions.keys()]);
    console.log(this.sessions.get(identifier), "sessions");

    if (!this.conversationId) {
      this.conversationId = conversationId;
      await this.state.storage.put("conversationId", conversationId);
    }

    await this.handle.initializeWebSocketConnection(
      socket,
      this.env,
      conversationId,
      userId
    );

    socket.addEventListener("message", async (event) => {
      await this.handle.handleWebSocketMessage(
        socket,
        event.data as string,
        this.env,
        conversationId,
        userId,
        businessId,
        isAdmin,
        (message: string) => this.broadcast(message),
        (message: string, excludedId: string) =>
          this.broadcastExcept(message, excludedId)
      );
    });

    socket.addEventListener("close", () => {
      this.sessions.delete(identifier);
      this.checkCleanup();
    });

    socket.addEventListener("error", () => {
      this.sessions.delete(identifier);
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

  broadcastExcept(message: string, excludedId: string) {
    for (const [id, socket] of this.sessions) {
      if (id !== excludedId) {
        try {
          socket.send(message);
        } catch {
          this.sessions.delete(id);
        }
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
