import { Media } from "../models/media";
import { getPrismaClient } from "../untils/db";

export async function createMany(
  env: Env,
  filesData: Array<{
    url: string;
    fileName: string;
    mimeType: string;
    size: number;
  }>
): Promise<Media[]> {
  const prisma = getPrismaClient(env);

  const createdMedia = await Promise.all(
    filesData.map(async (data) => {
      const media = await prisma.media.create({ data });
      return new Media(media); // nếu bạn dùng class Media để đóng gói
    })
  );

  return createdMedia;
}

export async function getMediaById(
  env: Env,
  id: string
): Promise<Media | null> {
  const prisma = getPrismaClient(env);
  const media = await prisma.media.findUnique({
    where: { id },
  });
  return new Media(media);
}
