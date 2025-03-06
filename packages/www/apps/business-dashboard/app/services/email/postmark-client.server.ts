import type { EmailData, EmailResponse } from "./email.server";
import { postmarkClient } from "~/lib/postmark.server";

export class PostmarkEmailClient {
  async send(data: EmailData): Promise<EmailResponse> {
    const response = await postmarkClient.sendEmailWithTemplate({
      From: data.from,
      To: data.to,
      TemplateId: data.templateId,
      TemplateModel: data.templateData,
      // TODO: Change this to be dynamic
      MessageStream: "staging-transactional",
    });

    if (response.ErrorCode !== 0) {
      return { status: "error", errorCode: response.ErrorCode };
    }

    return { status: "ok" };
  }
}
