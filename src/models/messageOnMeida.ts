import { Media } from "./media";
import { Message } from "./message";

export class MessageOnMedia {
  id: string;
  message: Message;
  media: Media;
  messageId: string;
  mediaId: string;
  addedAt: Date;

  constructor(data: any) {
    this.id = data.id!;
    this.message = data.message!;
    this.media = data.media!;
    this.messageId = data.messageId!;
    this.mediaId = data.mediaId!;
    this.addedAt = data.addedAt!;
  }
}
