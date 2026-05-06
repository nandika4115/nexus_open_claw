import { Planner } from "../../../src/engine/planner.js";

describe("planner", () => {
  it("plans heartbeat snapshot", () => {
    const planner = new Planner(undefined);
    const registry = new Map([
      [
        "session_snapshot",
        { name: "session_snapshot", handler: async () => undefined }
      ]
    ]);
    const plan = planner.plan({ type: "heartbeat_tick", timestamp: "" }, registry);
    expect(plan).toHaveLength(1);
  });
});
