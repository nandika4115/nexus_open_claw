import { PiEngine } from "../../src/engine/pi-engine.js";
import { Planner } from "../../src/engine/planner.js";
class TestLogger {
    info() { }
    warn() { }
    error() { }
}
describe("pi engine", () => {
    it("executes planned behavior", async () => {
        const logger = new TestLogger();
        const planner = new Planner(undefined);
        const engine = new PiEngine(logger, planner);
        let ran = false;
        engine.registerBehavior("session_snapshot", async () => {
            ran = true;
        });
        await engine.handleSignal({ type: "heartbeat_tick", timestamp: "" });
        expect(ran).toBe(true);
    });
});
