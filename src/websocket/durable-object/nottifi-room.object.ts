import { getUserByToken } from "../../services/user.service";

interface NotificationData {
  businessId: string;
  type: string;
  payload: any;
  senderType: string;
  targetUserId: string | null;
  targetRole: string;
}

export class NotificationRoom implements DurableObject {
  private sessions: Map<string, WebSocket> = new Map();
  private state: DurableObjectState;
  private env: Env;
  private businessSessions: Map<
    string,
    { admin: Set<string>; client: Set<string> }
  > = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async checkCleanup() {
    // Kiểm tra nếu không còn kết nối nào cho business
    let hasActiveConnections = false;
    for (const [businessId, sessions] of this.businessSessions) {
      if (sessions.admin.size > 0 || sessions.client.size > 0) {
        hasActiveConnections = true;
        break;
      }
    }

    if (!hasActiveConnections) {
      const cleanupTime = Date.now() + 1000 * 60 * 5; // 5 phút nữa
      await this.state.storage.put("cleanupTime", cleanupTime);
      await this.state.storage.setAlarm(cleanupTime);
    }
  }

  async alarm() {
    const cleanupTime = (await this.state.storage.get("cleanupTime")) as number;

    // Nếu chưa tới thời gian cleanup, không làm gì
    if (Date.now() < cleanupTime) return;

    // Kiểm tra lại xem có còn kết nối nào không
    let hasActiveConnections = false;
    for (const [businessId, sessions] of this.businessSessions) {
      if (sessions.admin.size > 0 || sessions.client.size > 0) {
        hasActiveConnections = true;
        break;
      }
    }

    // Nếu không còn kết nối nào, thực hiện cleanup
    if (!hasActiveConnections) {
      console.log("Cleaning up NotificationRoom Durable Object");
      this.businessSessions.clear();
      this.sessions.clear();
      await this.state.storage.delete("cleanupTime");
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    console.log("NotificationRoom: Request URL:", url.toString());

    if (url.pathname === "/connect") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }

      const token = url.searchParams.get("token");
      const businessId = url.searchParams.get("businessId");

      if (!token) {
        return new Response("Token is required", { status: 400 });
      }

      if (!businessId) {
        return new Response("Business ID is required", { status: 400 });
      }

      try {
        // Authenticate user
        const user = await getUserByToken(this.env, token);
        if (!user) {
          return new Response("Unauthorized", { status: 401 });
        }

        // Create WebSocket connection
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        const rolePrefix = user.role === "ADMIN" ? "admin" : "client";
        const identifier = `${rolePrefix}:${user.id}`;

        // Initialize businessSessions if not exists
        if (!this.businessSessions.has(businessId)) {
          console.log("Creating new business session for:", businessId);
          this.businessSessions.set(businessId, {
            admin: new Set(),
            client: new Set(),
          });
        }

        // Get the business session and add the identifier
        const businessSession = this.businessSessions.get(businessId);
        if (!businessSession) {
          console.error(
            "Failed to get or create business session for:",
            businessId
          );
          return new Response("Internal server error", { status: 500 });
        }

        // Add the session to both maps
        this.sessions.set(identifier, server);
        const roleSet =
          user.role === "ADMIN"
            ? businessSession.admin
            : businessSession.client;
        roleSet.add(identifier);

        // Log detailed session information
        console.log("WebSocket connection established:", {
          businessId,
          identifier,
          role: user.role,
          currentSessions: {
            admin: Array.from(businessSession.admin),
            client: Array.from(businessSession.client),
          },
          totalSessions: this.sessions.size,
          allBusinessIds: Array.from(this.businessSessions.keys()),
        });

        // Accept the connection
        server.accept();

        // Send a welcome message
        server.send(
          JSON.stringify({
            type: "CONNECTED",
            payload: {
              message: "Connected to notification server",
              userId: user.id,
              businessId: businessId,
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Add cleanup on close
        server.addEventListener("close", () => {
          console.log("WebSocket connection closed:", identifier);
          this.sessions.delete(identifier);
          roleSet.delete(identifier);

          // Log updated session state
          console.log("Updated sessions after close:", {
            businessId,
            admin: Array.from(businessSession.admin),
            client: Array.from(businessSession.client),
            totalSessions: this.sessions.size,
          });

          // Check if cleanup is needed
          this.checkCleanup();
        });

        // Return the client end of the WebSocket
        return new Response(null, { status: 101, webSocket: client });
      } catch (error) {
        console.error("Error establishing WebSocket connection:", error);
        return new Response("Authentication failed", { status: 401 });
      }
    }

    // Handle sending notifications
    if (url.pathname === "/notify") {
      try {
        const {
          businessId,
          type,
          payload,
          senderType,
          targetUserId,
          targetRole,
        } = (await request.json()) as NotificationData;

        // Validate businessId
        if (!businessId) {
          return new Response("Business ID is required", { status: 400 });
        }

        // Get business session
        const businessSession = this.businessSessions.get(businessId);

        // Nếu có targetUserId, chỉ gửi cho user đó trong business
        if (targetUserId) {
          const targetIdentifier = `${targetRole}:${targetUserId}`;
          const socket = this.sessions.get(targetIdentifier);

          if (socket && socket.readyState === WebSocket.OPEN) {
            try {
              const notify = JSON.stringify({
                type,
                payload,
                businessId,
                receivedAt: new Date().toISOString(),
              });
              socket.send(notify);
            } catch (error) {
              console.error(
                `Failed to send notification to ${targetIdentifier}:`,
                error
              );
            }
          }
        } else {
          // Gửi cho tất cả user trong business
          const allSessions = new Set([...businessSession.admin]);

          for (const identifier of allSessions) {
            const socket = this.sessions.get(identifier);
            if (socket && socket.readyState === WebSocket.OPEN) {
              try {
                const notify = JSON.stringify({
                  type,
                  payload,
                  businessId,
                  receivedAt: new Date().toISOString(),
                });
                socket.send(notify);
              } catch (error) {
                console.error(
                  `Failed to send notification to ${identifier}:`,
                  error
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing notification:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to process notification",
            details: error.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  }
}
