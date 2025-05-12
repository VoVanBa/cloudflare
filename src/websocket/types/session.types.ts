export interface Session {
  socket: WebSocket;
  userId: string;
  isAdmin: boolean;
  businessId: string;
  conversationId: string;
}

export interface SessionManager {
  addSession(businessId: string, identifier: string, session: Session): void;
  removeSession(businessId: string, identifier: string): void;
  getSessions(businessId: string): Map<string, Session>;
  getSession(businessId: string, identifier: string): Session | undefined;
  broadcast(message: string, businessId: string): void;
  broadcastExcept(
    message: string,
    excludedId: string,
    businessId: string
  ): void;
}

export type SessionMap = Map<string, Map<string, Session>>; // businessId -> Map<identifier, Session>
