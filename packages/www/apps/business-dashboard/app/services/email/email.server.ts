import { type EmailTemplate, type TemplateData } from "./templates.js";

export interface EmailData {
  from: string;
  to: string;
  templateId: number;
  templateData: TemplateData;
}

export interface EmailResponse {
  status: "ok" | "error";
  errorCode?: number;
}

export interface EmailClient {
  send(data: EmailData): Promise<EmailResponse>;
}

export class EmailService {
  client: EmailClient;

  constructor(client: EmailClient) {
    this.client = client;
  }

  async sendTemplate({
    template,
    to,
    from,
  }: {
    template: EmailTemplate<TemplateData>;
    to: string;
    from: string;
  }): Promise<EmailResponse> {
    const data = template.getMailData(to, from);
    return await this.client.send(data);
  }
}
