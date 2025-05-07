import {
  findConversationRead,
  updateConversationRead,
} from "../repositories/conversation-read.repository";
import { ConversationRead } from "../models/conversation-read";
import { countUnreadMessages } from "./message.service";

export async function markConversationAsRead(
  env: Env,
  conversationId: string,
  userId: string
): Promise<ConversationRead> {
  try {
    // Call the repository function to update or create the conversation read record
    const conversationRead = await updateConversationRead(
      env,
      userId,
      conversationId
    );
    return conversationRead;
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    throw new Error("Failed to mark conversation as read");
  }
}

export async function getUnreadCount(
  env: Env,
  conversationId: string,
  userId: string
): Promise<number> {
  const conversationRead = await findConversationRead(
    env,
    userId,
    conversationId
  );

  const lastReadAt = conversationRead?.lastReadAt || new Date(0);

  const unreadCount = await countUnreadMessages(
    env,
    conversationId,
    userId,
    lastReadAt
  );

  return unreadCount;
}
