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
        console.log("User authenticated with businessId:", businessId);

        // Create WebSocket connection
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        // Store session based on user role
        const adminIdentifier = `admin:${user.id}`;
        this.sessions.set(adminIdentifier, server);

        // Track sessions by business ID
        if (!this.businessSessions.has(businessId)) {
          this.businessSessions.set(businessId, new Set());
        }
        this.businessSessions.get(businessId)?.add(adminIdentifier);

        console.log(
          `New WebSocket connection: ${adminIdentifier} for business: ${businessId}`
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
          console.log("WebSocket closed, removing session:", adminIdentifier);
          this.sessions.delete(adminIdentifier);
          this.businessSessions.get(businessId)?.delete(adminIdentifier);

          // Clean up empty business sets
          if (this.businessSessions.get(businessId)?.size === 0) {
            this.businessSessions.delete(businessId);
          }
        });

        server.addEventListener("error", (event) => {
          console.error("WebSocket error:", event);
          this.sessions.delete(adminIdentifier);
          this.businessSessions.get(businessId)?.delete(adminIdentifier);
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
        const { businessId, type, payload } = await request.json();

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
          for (const adminIdentifier of adminSet) {
            const socket = this.sessions.get(adminIdentifier);
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type, payload }));
              messagesSent.push(adminIdentifier);
            }
          }

          console.log(
            `Notification sent to ${messagesSent.length} admins for business ${businessId}`
          );
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
