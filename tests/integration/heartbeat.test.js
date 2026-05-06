import { HeartbeatDaemon } from "../../src/engine/heartbeat.js";
class TestLogger {
    info() { }
    warn() { }
    error() { }
}
describe("heartbeat daemon", () => {
    it("dispatches tick", async () => {
        const logger = new TestLogger();
        let triggered = false;
        const daemon = new HeartbeatDaemon(logger, process.cwd(), { intervalMin: 60, dailySchedules: [] }, async () => {
            triggered = true;
        });
        await daemon.start();
        daemon.stop();
        expect(triggered).toBe(true);
    });
});
