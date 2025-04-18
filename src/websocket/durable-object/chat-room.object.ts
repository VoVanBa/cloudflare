import {
  handleWebSocketMessage,
  initializeWebSocketConnection,
} from "../handler/websocket.handler";

// Định nghĩa lớp ChatRoom, đại diện cho một phòng chat sử dụng Durable Object
export class ChatRoom implements DurableObject {
  // Lưu trữ tất cả các phiên WebSocket đang kết nối, với key là sessionId
  private sessions: Map<string, WebSocket> = new Map();

  // Trạng thái nội bộ của Durable Object (được Cloudflare cung cấp)
  private state: DurableObjectState;

  // Biến môi trường chứa cấu hình, key API, v.v.
  private env: Env;

  // ID của cuộc hội thoại hiện tại
  private conversationId: string | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Đảm bảo các thao tác bất đồng bộ được hoàn tất trước khi xử lý tiếp
    this.state.blockConcurrencyWhile(async () => {
      // Lấy conversationId đã lưu trữ trước đó (nếu có)
      const stored = await this.state.storage.get("conversationId");
      this.conversationId = stored as string | null;
    });
  }

  // Xử lý các request gửi đến Durable Object
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Nếu là request khởi tạo WebSocket
    if (url.pathname === "/websocket") {
      // Kiểm tra header Upgrade để xác nhận là WebSocket
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }

      // Tạo một cặp WebSocket (client & server)
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Xử lý phiên kết nối WebSocket phía server
      this.handleSession(server, url);

      // Trả về WebSocket client để client-side kết nối
      return new Response(null, { status: 101, webSocket: client });
    }

    // Trả về 404 nếu không khớp route
    return new Response("Not found", { status: 404 });
  }

  // Xử lý từng kết nối WebSocket mới
  async handleSession(socket: WebSocket, url: URL) {
    // Tạo sessionId ngẫu nhiên cho kết nối này
    const sessionId = crypto.randomUUID();

    // Lấy các tham số truy vấn từ URL
    const conversationId = url.searchParams.get("conversationId");
    const userId = url.searchParams.get("userId");
    const businessId = url.searchParams.get("businessId");
    const isAdmin = url.searchParams.get("isAdmin") === "true";

    // Nếu thiếu conversationId thì từ chối kết nối
    if (!conversationId) {
      socket.close(1008, "Missing conversationId");
      return;
    }

    // Lưu socket mới vào danh sách session
    this.sessions.set(sessionId, socket);

    // Nếu chưa có conversationId nội bộ thì gán và lưu lại
    if (!this.conversationId) {
      this.conversationId = conversationId;
      await this.state.storage.put("conversationId", conversationId);
    }

    // Chấp nhận kết nối WebSocket
    socket.accept();

    // Gửi dữ liệu khởi tạo đến client (nếu cần)
    await initializeWebSocketConnection(socket, this.env, conversationId);

    // Đăng ký lắng nghe tin nhắn gửi đến từ client
    socket.addEventListener("message", async (event) => {
      await handleWebSocketMessage(
        socket,
        event.data as string,
        this.env,
        conversationId,
        userId,
        isAdmin,
        (message: string) => this.broadcast(message) // Hàm gửi broadcast đến tất cả session
      );
    });

    // Khi kết nối đóng thì xóa khỏi danh sách
    socket.addEventListener("close", () => {
      this.sessions.delete(sessionId);
      this.checkCleanup(); // Kiểm tra xem có cần cleanup hay không
    });

    // Tương tự với lỗi kết nối
    socket.addEventListener("error", () => {
      this.sessions.delete(sessionId);
      this.checkCleanup();
    });
  }

  // Gửi message đến tất cả socket đang kết nối trong phòng
  broadcast(message: string) {
    for (const [id, socket] of this.sessions) {
      try {
        socket.send(message);
      } catch {
        // Nếu lỗi thì loại bỏ socket đó khỏi danh sách
        this.sessions.delete(id);
      }
    }
  }

  // Nếu không còn kết nối nào, lên lịch cleanup trong 5 phút
  checkCleanup() {
    if (this.sessions.size === 0) {
      this.state.setAlarm(Date.now() + 1000 * 60 * 5);
    }
  }

  // Hàm được gọi tự động khi tới thời gian hẹn alarm
  async alarm() {
    if (this.sessions.size === 0) {
      console.log("Cleaning up ChatRoom Durable Object");
      // Xoá conversationId đã lưu
      await this.state.storage.delete("conversationId");
    }
  }
}
