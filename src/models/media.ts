import { MessageOnMedia } from "./messageOnMeida";

export class Media {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number; // in bytes
  uploadedAt: Date;
  messages: MessageOnMedia[];

  constructor(data: any) {
    this.id = data.id!;
    this.url = data.url!;
    this.fileName = data.fileName!;
    this.mimeType = data.mimeType!;
    this.size = data.size!;
    this.uploadedAt = data.uploadedAt!;
    this.messages = data.messages || [];
  }
}
