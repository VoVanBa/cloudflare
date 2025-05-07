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

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    console.log("NotificationRoom: Request URL:", url.toString());

    // Handle new WebSocket connection
    if (url.pathname === "/connect") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }

      // Get token and businessId from query parameters
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

        console.log("Notification request received:", {
          businessId,
          type,
          payload,
          senderType,
          targetUserId,
          targetRole,
        });

        if (!businessId) {
          return new Response("Business ID is required", { status: 400 });
        }

        // Log all business sessions for debugging
        console.log("All business sessions:", {
          businessIds: Array.from(this.businessSessions.keys()),
          sessions: Object.fromEntries(
            Array.from(this.businessSessions.entries()).map(([id, session]) => [
              id,
              {
                admin: Array.from(session.admin),
                client: Array.from(session.client),
              },
            ])
          ),
        });

        const businessSession = this.businessSessions.get(businessId);
        console.log("Target business session:", {
          businessId,
          exists: !!businessSession,
          adminCount: businessSession?.admin.size || 0,
          clientCount: businessSession?.client.size || 0,
        });

        if (businessSession) {
          // Xác định danh sách người nhận dựa trên targetRole
          const targetRoleSet =
            businessSession[targetRole as keyof typeof businessSession];
          let notifiedCount = 0;

          console.log("Target role set:", {
            role: targetRole,
            size: targetRoleSet?.size || 0,
            members: Array.from(targetRoleSet || []),
          });

          for (const identifier of targetRoleSet || []) {
            // Nếu có targetUserId, chỉ gửi cho user đó
            if (targetUserId && !identifier.includes(targetUserId)) {
              console.log(`Skipping session ${identifier}: not target user`);
              continue;
            }

            const socket = this.sessions.get(identifier);
            console.log(
              `Socket for ${identifier}:`,
              socket ? "Found" : "Not found",
              socket?.readyState === WebSocket.OPEN
                ? "and OPEN"
                : "but not OPEN"
            );

            if (socket && socket.readyState === WebSocket.OPEN) {
              const notify = JSON.stringify({
                type,
                payload,
                receivedAt: new Date().toISOString(),
              });

              console.log(`Sending notification to ${identifier}`);
              socket.send(notify);
              notifiedCount++;
            } else {
              console.log(`Socket for ${identifier} not available or closed`);
            }
          }

          return new Response(
            JSON.stringify({
              success: notifiedCount > 0,
              notifiedCount,
              message:
                notifiedCount === 0 ? "No active sessions found" : undefined,
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            message: "No active sessions found for this business",
            storedInDatabase: true,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error processing notification:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to process notification",
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
