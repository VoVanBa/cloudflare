import { CreateMessageDto } from "../dtos/request/message.dto";
import { getConversationById } from "../services/conversation.service";
import { createMessage, getAllMessage } from "../services/message.service";
import { getPrismaClient } from "../untils/db";

// src/durable-objects/chat-room.ts
export class ChatRoom implements DurableObject {
  private sessions: Map<string, WebSocket> = new Map();
  private state: DurableObjectState;
  private env: Env;
  private conversationId: string | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Lấy dữ liệu chat lịch sử nếu có
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("conversationId");
      this.conversationId = (stored as string) || null;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/websocket") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }

      // Xử lý websocket connection
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleSession(server, request);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // if (url.pathname === "/api/messages" && request.method === "POST") {
    //   const message = (await request.json()) as CreateMessageDto;

    //   if (!this.conversationId) {
    //     this.conversationId = message.conversationId;
    //     await this.state.storage.put("conversationId", this.conversationId);
    //   }

    //   // Lưu message vào D1 database qua Prisma
    //   await createMessage(this.env, {
    //     conversationId: this.conversationId,
    //     content: message.content,
    //     senderType: message.senderType,
    //     userId: message.userId,
    //     guestId: message.guestId,
    //   });

    //   // Broadcast message đến tất cả clients
    //   this.broadcast(
    //     JSON.stringify({
    //       type: "NEW_MESSAGE",
    //       message: message,
    //     })
    //   );

    //   return new Response(JSON.stringify({ success: true }), {
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    return new Response("Not found", { status: 404 });
  }

  async handleSession(webSocket: WebSocket, request: Request) {
    // Extract session information from request
    const url = new URL(request.url);
    const sessionId = crypto.randomUUID();

    // Parse URL parameters
    const conversationId = url.searchParams.get("conversationId");
    const businessId = url.searchParams.get("businessId");
    const userId = url.searchParams.get("userId");
    const isAdmin = url.searchParams.get("isAdmin") === "true";

    // Store the WebSocket connection
    this.sessions.set(sessionId, webSocket);

    // Nếu là conversation mới, tạo trong DB
    if (conversationId && !this.conversationId) {
      this.conversationId = conversationId;
      await this.state.storage.put("conversationId", this.conversationId);
    }

    // Setup event handlers
    webSocket.accept();

    webSocket.addEventListener("message", async (event) => {
      try {
        const data = JSON.parse(event.data as string) as CreateMessageDto;

        // Xử lý message mới
        // if (data.type === "SEND_MESSAGE") {
        // Lưu message vào database
        const newMessage = await createMessage(this.env, {
          conversationId: this.conversationId!,
          content: data.content,
          senderType: isAdmin ? "ADMIN" : "CLIENT",
          userId: userId ?? undefined,
          guestId: !isAdmin ? userId || crypto.randomUUID() : undefined,
        });

        // Gửi lại message cho tất cả kết nối
        this.broadcast(
          JSON.stringify({
            type: "NEW_MESSAGE",
            message: newMessage,
          })
        );
        // }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    webSocket.addEventListener("close", (event) => {
      this.sessions.delete(sessionId);
    });

    webSocket.addEventListener("error", (event) => {
      this.sessions.delete(sessionId);
    });

    // Gửi lịch sử tin nhắn khi kết nối
    if (this.conversationId) {
      try {
        const conversation = await getConversationById(
          this.env,
          this.conversationId
        );

        if (conversation && conversation.messages) {
          webSocket.send(
            JSON.stringify({
              type: "HISTORY",
              messages: conversation.messages.map((message) => ({
                id: message.id,
                content: message.content,
                senderType: message.senderType,
                createdAt: message.createdAt,
              })),
            })
          );
        } else {
          console.error("Conversation or messages are null.");
        }
      } catch (error) {
        console.error("Error fetching message history:", error);
      }
    }
  }

  broadcast(message: string) {
    for (const [sessionId, session] of this.sessions) {
      try {
        session.send(message);
      } catch (error) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
