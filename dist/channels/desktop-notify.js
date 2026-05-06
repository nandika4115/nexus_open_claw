import notifier from "node-notifier";
export class DesktopNotifier {
    async notify(payload) {
        await new Promise((resolve, reject) => {
            notifier.notify({
                title: payload.title,
                message: payload.message,
                actions: payload.actions
            }, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
}
