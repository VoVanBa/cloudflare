import { getUserByToken } from "../../services/user.service";

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
        console.log("Sessions after adding:", [...this.sessions.keys()]);

        if (!this.businessSessions.has(businessId)) {
          this.businessSessions.set(businessId, {
            admin: new Set(),
            client: new Set(),
          });
        }

        const roleSet =
          user.role === "ADMIN"
            ? this.businessSessions.get(businessId)?.admin
            : this.businessSessions.get(businessId)?.client;

        roleSet?.add(identifier);

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
        const { businessId, type, payload, senderType, targetUserId } =
          await request.json();

        console.log("Notification request received:", {
          businessId,
          type,
          payload,
          senderType,
          targetUserId,
        });

        if (!businessId) {
          return new Response("Business ID is required", { status: 400 });
        }

        const businessSession = this.businessSessions.get(businessId);
        if (businessSession) {
          const targetRoleSet =
            senderType === "ADMIN"
              ? businessSession.client
              : businessSession.admin;
          let notifiedCount = 0;

          console.log(
            `Looking for ${
              senderType === "ADMIN" ? "client" : "admin"
            } sessions, targetUserId: ${targetUserId || "all"}`
          );

          for (const identifier of targetRoleSet || []) {
            console.log(
              `Checking identifier: ${identifier}, isTargetPrefix: ${identifier.startsWith(
                senderType === "ADMIN" ? "client" : "admin"
              )}`
            );

            if (targetUserId && !identifier.includes(targetUserId)) {
              console.log(`Skipping session ${identifier}: not target user`);
              continue;
            }

            const socket = this.sessions.get(identifier);
            console.log(
              `Socket for ${identifier}:`,
              socket ? "Found" : "Not found"
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
                notifiedCount === 0
                  ? "No active client sessions found"
                  : undefined,
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
            storedInDatabase: true, // Confirm notification saved
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
