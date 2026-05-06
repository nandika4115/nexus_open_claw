export type SignalType = "heartbeat_tick" | "daily_schedule" | "external_event";

export interface EngineSignal {
  type: SignalType;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export interface BehaviorContext {
  signal: EngineSignal;
}

export type BehaviorHandler = (context: BehaviorContext) => Promise<void>;

export interface PlannedBehavior {
  name: string;
  handler: BehaviorHandler;
}
