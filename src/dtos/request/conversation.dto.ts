export interface CreateConversationRequestDto {
  businessId: string; // bắt buộc
  userId?: string; // nếu là user đã đăng ký
}
