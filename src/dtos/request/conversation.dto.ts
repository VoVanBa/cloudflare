export interface CreateConversationRequestDto {
  businessId: string; // bắt buộc
  guestId?: number; // nếu là guest (ẩn danh)
  userId?: string; // nếu là user đã đăng ký
  clientType: "GUEST" | "USER"; // enum
}
export interface UpdateConversationRequestDto {
  id: string; // bắt buộc
  businessId?: string; // bắt buộc
  guestId?: number; // nếu là guest (ẩn danh)
  userId?: string; // nếu là user đã đăng ký
  clientType?: "GUEST" | "USER"; // enum
}