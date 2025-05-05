import { SenderType } from "../../models/enums";
import { getUserByToken } from "../../services/user.service";

export class NotificationRoom implements DurableObject {
  private sessions: Map<string, WebSocket> = new Map();
  private state: DurableObjectState;
  private env: Env;
  private businessSessions: Map<string, Set<string>> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    console.log("NotificationRoom: Request URL:", url.toString());
    let businessId = "";
    // Handle WebSocket connections
    if (url.pathname === "/connect") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }

      // Get token from query parameters
      const token = url.searchParams.get("token");
      if (!token) {
        return new Response("Token is required", { status: 400 });
      }

      try {
        // Authenticate user
        const user = await getUserByToken(this.env, token);
        if (!user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const businessId = user.businessId;

        // Create WebSocket connection
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        const rolePrefix = user.role === "ADMIN" ? "admin" : "client";
        const identifier = `${rolePrefix}:${user.id}`;
        this.sessions.set(identifier, server);

        if (!this.businessSessions.has(businessId)) {
          this.businessSessions.set(businessId, new Set());
        }
        this.businessSessions.get(businessId)?.add(identifier);

        console.log(
          `New WebSocket connection: ${identifier} for business: ${businessId}`
        );

        // Accept the connection
        server.accept();

        // Send a welcome message
        server.send(
          JSON.stringify({
            type: "CONNECTED",
            payload: {
              message: "Connected to notification server",
              userId: user.id,
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Handle WebSocket events
        server.addEventListener("close", () => {
          console.log("WebSocket closed, removing session:", identifier);
          this.sessions.delete(identifier);
          this.businessSessions.get(businessId)?.delete(identifier);

          // Clean up empty business sets
          if (this.businessSessions.get(businessId)?.size === 0) {
            this.businessSessions.delete(businessId);
          }
        });

        server.addEventListener("error", (event) => {
          console.error("WebSocket error:", event);
          this.sessions.delete(identifier);
          this.businessSessions.get(businessId)?.delete(identifier);
        });

        // Return the client end of the WebSocket
        return new Response(null, { status: 101, webSocket: client });
      } catch (error) {
        console.error("Error establishing WebSocket connection:", error);
        return new Response("Authentication failed", { status: 401 });
      }
    }

    // Handle notification endpoint
    if (url.pathname === "/notify") {
      try {
        const { businessId, type, payload, senderType } = await request.json();

        console.log("Notification request received:", {
          businessId,
          type,
          payload,
        });

        if (!businessId) {
          return new Response("Business ID is required", { status: 400 });
        }

        // Get all admin sessions for this business
        const adminSet = this.businessSessions.get(businessId);
        const messagesSent: string[] = [];

        if (adminSet && adminSet.size > 0) {
          const targetPrefix =
            senderType === SenderType.ADMIN ? "client" : "admin";
          for (const identifier of adminSet) {
            console.log("Checking identifier:", identifier);
            if (identifier.startsWith(targetPrefix)) {
              const socket = this.sessions.get(identifier);
              if (socket && socket.readyState === WebSocket.OPEN) {
                const notify = JSON.stringify({ type, payload });
                socket.send(notify); // chỉ gửi đến đúng đối tượng
                messagesSent.push(identifier);
              }
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              recipients: messagesSent.length,
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            message: "No active admin sessions found for this business",
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

    // Default response for unhandled paths
    return new Response("Not found", { status: 404 });
  }
}
