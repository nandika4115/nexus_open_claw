import notifier from "node-notifier";

export interface NotificationPayload {
  title: string;
  message: string;
  actions?: string[];
}

export class DesktopNotifier {
  async notify(payload: NotificationPayload): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      notifier.notify(
        {
          title: payload.title,
          message: payload.message,
          actions: payload.actions
        },
        (error: Error | null) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        }
      );
    });
  }
}
