export enum SenderType {
  CLIENT = "CLIENT",
  ADMIN = "ADMIN",
}

export enum UserRole {
  CLIENT = "CLIENT",
  ADMIN = "ADMIN",
}

export enum NotificationType {
  NEW_MESSAGE = "NEW_MESSAGE",
  SYSTEM = "SYSTEM",
  MESSAGE_READ = "MESSAGE_READ",
  CONVERSATION_NEW = "CONVERSATION_NEW",
  OTHER = "OTHER",
}

export enum ChatType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  FILE = "FILE",
  AUDIO = "AUDIO",
}

export enum AssignmentStatus {
  ACTIVE = "ACTIVE",       // Đang được gán
  COMPLETED = "COMPLETED", // Hoàn thành xử lý
  TRANSFERRED = "TRANSFERRED", // Đã chuyển giao
  CANCELLED = "CANCELLED"  // Đã hủy gán
}

export enum ConversationStatus {
  OPEN = "OPEN",           // Mới tạo, chưa được gán
  PENDING = "PENDING",     // Đang chờ xử lý
  IN_PROGRESS = "IN_PROGRESS", // Đang được xử lý
  WAITING = "WAITING",     // Đang chờ phản hồi từ client
  CLOSED = "CLOSED"        // Đã đóng
}
