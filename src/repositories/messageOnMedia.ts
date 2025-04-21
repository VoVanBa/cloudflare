import { MessageOnMedia } from "../models/messageOnMeida";
import { getPrismaClient } from "../untils/db";

export async function createMany(
  env: Env,
  messageId: string,
  mediaIds: string[]
): Promise<MessageOnMedia[]> {
  const prisma = getPrismaClient(env);

  const createdLinks = await Promise.all(
    mediaIds.map(async (mediaId) => {
      const record = await prisma.messageOnMedia.create({
        data: {
          messageId,
          mediaId,
        },
      });
      return new MessageOnMedia(record);
    })
  );

  return createdLinks;
}
