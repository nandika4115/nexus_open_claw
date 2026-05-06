import nodemailer from "nodemailer";
export class EmailChannel {
    transport;
    recipients;
    sender;
    constructor(config) {
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
    async send(subject, body) {
        await this.transport.sendMail({
            from: this.sender,
            to: this.recipients,
            subject,
            text: body
        });
    }
}
