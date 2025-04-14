// export class Conversation implements DurableObject {
//   // Trạng thái Durable Object (để lưu trữ persistent)
//   private state: DurableObjectState;

//   // Danh sách các WebSocket của business, theo operatorId
//   private businessSockets: Map<string, WebSocket> = new Map();

//   // WebSocket của client (chỉ 1)
//   private clientSocket: WebSocket | null = null;

//   // Thông tin cuộc hội thoại
//   private conversationData: ConversationData | null = null;

//   // Bộ đệm tin nhắn (lưu tối đa 200 tin)
//   private messageBuffer: MessageData[] = [];

//   constructor(state: DurableObjectState) {
//     this.state = state;

//     // Đảm bảo các thao tác khởi tạo chỉ chạy 1 lần (tránh race conditions)
//     this.state.blockConcurrencyWhile(async () => {
//       this.conversationData = await this.state.storage.get("conversationData");

//       const storedMessages = await this.state.storage.get("messages");
//       if (storedMessages) {
//         this.messageBuffer = storedMessages;
//       }
//     });
//   }

//   // Entry point xử lý các request đến Durable Object
//   async fetch(request: Request) {
//     const url = new URL(request.url);

//     // Xử lý kết nối WebSocket
//     if (url.pathname === "/connect") {
//       const pair = new WebSocketPair();
//       const client = pair[0],
//         server = pair[1];

//       const userType = url.searchParams.get("type");
//       const userId = url.searchParams.get("userId");

//       if (!userType || !userId)
//         return new Response("Missing parameters", { status: 400 });

//       // Phân loại người dùng
//       if (userType === "business") {
//         await this.handleBusinessConnection(server, userId);
//       } else if (userType === "client") {
//         await this.handleClientConnection(server, userId);
//       } else {
//         return new Response("Invalid user type", { status: 400 });
//       }

//       // Trả WebSocket cho client để hoàn tất handshake
//       return new Response(null, {
//         status: 101,
//         webSocket: client,
//       });
//     }

//     // Nhận tin nhắn mới qua HTTP POST
//     if (url.pathname === "/message" && request.method === "POST") {
//       const message = await request.json();
//       await this.processMessage(message);
//       return new Response("Message received", { status: 200 });
//     }

//     // Trả thông tin conversation
//     if (url.pathname === "/info" && request.method === "GET") {
//       return new Response(JSON.stringify(this.conversationData), {
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Cập nhật thông tin conversation
//     if (url.pathname === "/update" && request.method === "POST") {
//       const updates = await request.json();
//       this.conversationData = { ...this.conversationData, ...updates };
//       await this.state.storage.put("conversationData", this.conversationData);
//       this.broadcastEvent({
//         type: "conversation_updated",
//         data: this.conversationData,
//       });
//       return new Response("Conversation updated", { status: 200 });
//     }

//     return new Response("Not found", { status: 404 });
//   }

//   // Xử lý kết nối của business (operator)
//   private async handleBusinessConnection(
//     webSocket: WebSocket,
//     operatorId: string
//   ) {
//     webSocket.accept();

//     // Gửi lịch sử chat cho business mới vào
//     webSocket.send(
//       JSON.stringify({ type: "history", messages: this.messageBuffer })
//     );

//     // Lưu socket
//     this.businessSockets.set(operatorId, webSocket);

//     // Gửi event cho client biết operator đã vào
//     this.broadcastEvent({ type: "business_joined", operatorId });

//     // Lắng nghe tin nhắn từ operator
//     webSocket.addEventListener("message", async (event) => {
//       const message: Partial<MessageData> = JSON.parse(event.data as string);
//       message.senderType = "business";
//       message.senderId = operatorId;
//       await this.processMessage(message);
//     });

//     // Xử lý khi business ngắt kết nối
//     webSocket.addEventListener("close", () => {
//       this.businessSockets.delete(operatorId);
//       this.broadcastEvent({ type: "business_left", operatorId });
//     });
//   }

//   // Xử lý kết nối của client
//   private async handleClientConnection(webSocket: WebSocket, clientId: string) {
//     webSocket.accept();

//     // Gửi lịch sử chat cho client
//     webSocket.send(
//       JSON.stringify({ type: "history", messages: this.messageBuffer })
//     );

//     // Nếu đã có client cũ → đóng kết nối
//     if (this.clientSocket) {
//       this.clientSocket.close();
//     }

//     this.clientSocket = webSocket;

//     // Tạo dữ liệu conversation nếu chưa có
//     if (!this.conversationData) {
//       this.conversationData = {
//         id: crypto.randomUUID(),
//         clientId,
//         createdAt: Date.now(),
//         updatedAt: Date.now(),
//         lastMessageAt: null,
//       };
//       await this.state.storage.put("conversationData", this.conversationData);
//     }

//     // Đảm bảo clientId khớp với conversation
//     if (this.conversationData.clientId !== clientId) {
//       webSocket.send(
//         JSON.stringify({ type: "error", message: "Invalid client ID" })
//       );
//       webSocket.close();
//       return;
//     }

//     // Lắng nghe tin nhắn từ client
//     webSocket.addEventListener("message", async (event) => {
//       const message: Partial<MessageData> = JSON.parse(event.data as string);
//       message.senderType = "client";
//       message.senderId = clientId;
//       await this.processMessage(message);
//     });

//     // Xử lý khi client ngắt kết nối
//     webSocket.addEventListener("close", () => {
//       this.clientSocket = null;
//     });
//   }

//   // Xử lý tin nhắn từ client/business gửi tới
//   private async processMessage(message: Partial<MessageData>) {
//     const enrichedMessage: MessageData = {
//       id: message.id || crypto.randomUUID(),
//       content: message.content!,
//       createdAt: Date.now(),
//       senderId: message.senderId!,
//       senderType: message.senderType!,
//     };

//     // Lưu vào bộ đệm và storage
//     this.messageBuffer.push(enrichedMessage);
//     if (this.messageBuffer.length > 200) this.messageBuffer.shift(); // giữ tối đa 200 tin
//     await this.state.storage.put("messages", this.messageBuffer);

//     // Cập nhật timestamp của conversation
//     if (this.conversationData) {
//       this.conversationData.lastMessageAt = enrichedMessage.createdAt;
//       this.conversationData.updatedAt = enrichedMessage.createdAt;
//       await this.state.storage.put("conversationData", this.conversationData);
//     }

//     // Gửi đến tất cả các socket đang kết nối
//     this.broadcastMessage(enrichedMessage);
//   }

//   // Gửi tin nhắn đến tất cả client + business
//   private broadcastMessage(message: MessageData) {
//     const payload = JSON.stringify({ type: "message", data: message });

//     // Gửi cho client
//     if (this.clientSocket) {
//       try {
//         this.clientSocket.send(payload);
//       } catch {
//         this.clientSocket = null;
//       }
//     }

//     // Gửi cho tất cả business
//     for (const [operatorId, socket] of this.businessSockets.entries()) {
//       try {
//         socket.send(payload);
//       } catch {
//         this.businessSockets.delete(operatorId);
//       }
//     }
//   }

//   // Gửi event hệ thống (operator joined, updated...) đến client và business
//   private broadcastEvent(event: any) {
//     const payload = JSON.stringify(event);

//     if (this.clientSocket) {
//       try {
//         this.clientSocket.send(payload);
//       } catch {
//         this.clientSocket = null;
//       }
//     }

//     for (const [operatorId, socket] of this.businessSockets.entries()) {
//       try {
//         socket.send(payload);
//       } catch {
//         this.businessSockets.delete(operatorId);
//       }
//     }
//   }
// }
