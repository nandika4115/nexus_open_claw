import nodemailer from "nodemailer";

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  recipients: string[];
}

export class EmailChannel {
  private readonly transport;
  private readonly recipients: string[];
  private readonly sender: string;

  constructor(config: EmailConfig) {
    this.transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
    this.recipients = config.recipients;
    this.sender = config.user;
  }

  async send(subject: string, body: string): Promise<void> {
    await this.transport.sendMail({
      from: this.sender,
      to: this.recipients,
      subject,
      text: body
    });
  }
}
