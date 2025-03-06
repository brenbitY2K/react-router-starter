import { type Logger } from "~/logging/index.js";
import type { EmailData, EmailResponse } from "../../email.server";

export class MockEmailClient {
  private logger: Logger;
  constructor({ logger }: { logger: Logger }) {
    this.logger = logger;
  }

  async send(data: EmailData): Promise<EmailResponse> {
    this.logger.info(data, "Fake sending email...");
    return { status: "ok" };
  }

  async sendMultiple(data: EmailData): Promise<EmailResponse> {
    this.logger.info(data, "Fake multiple fake emails...");
    return { status: "ok" };
  }
}
