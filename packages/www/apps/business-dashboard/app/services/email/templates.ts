import { type EmailData } from "./email.server";

export interface TemplateData {
  [key: string]: any;
}

export abstract class EmailTemplate<T extends TemplateData> {
  protected data: T;

  constructor(data: T) {
    this.data = data;
  }

  abstract getTemplateId(): number;

  getMailData(to: string, from: string): EmailData {
    return {
      to,
      from,
      templateId: this.getTemplateId(),
      templateData: this.data,
    };
  }
}

interface TeamInvitationData extends TemplateData {
  invite_sender_name: string;
  team_name: string;
  invitation_url: string;
}
export class TeamInvitationTemplate extends EmailTemplate<TeamInvitationData> {
  getTemplateId(): number {
    return 38342492;
  }
}

interface UserEmailOTPLoginData extends TemplateData {
  login_code: string;
  login_url: string;
}
export class UserEmailOTPLoginTemplate extends EmailTemplate<UserEmailOTPLoginData> {
  getTemplateId() {
    return 38342366;
  }
}

interface UserEmailOTPEmailChangeData extends TemplateData {
  email_change_link: string;
}
export class UserEmailOTPEmailChangeTemplate extends EmailTemplate<UserEmailOTPEmailChangeData> {
  getTemplateId() {
    return 38344238;
  }
}

interface ExampleData extends TemplateData {
  exampleMessage: string;
}
export class ExampleTemplate extends EmailTemplate<ExampleData> {
  getTemplateId() {
    // TODO: insert template ID here
    return 4;
  }
}
