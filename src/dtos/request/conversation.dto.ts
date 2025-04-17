import { ClientType } from "../../models/enums";

export interface CreateConversationRequestDto {
  businessId: string; // bắt buộc
  guestId?: string; // nếu là guest (ẩn danh)
  userId?: string; // nếu là user đã đăng ký
  clientType: ClientType; // enum
}
export interface UpdateConversationRequestDto {
  id: string; // bắt buộc
  businessId?: string; // bắt buộc
  guestId?: string; // nếu là guest (ẩn danh)
  userId?: string; // nếu là user đã đăng ký
  clientType?: "GUEST" | "USER"; // enum
}


