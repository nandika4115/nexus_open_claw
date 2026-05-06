import type { IncomingMessage } from "http";

export interface AuthConfig {
  apiKey?: string;
}

export function authorizeRequest(request: IncomingMessage, config: AuthConfig): boolean {
  if (!config.apiKey) {
    return true;
  }
  const header = request.headers["x-api-key"];
  if (!header) {
    return false;
  }
  const provided = Array.isArray(header) ? header[0] : header;
  return provided === config.apiKey;
}
