import { ensureToken } from "./auth";
import { config } from "../config";
import { debug } from "../utils/debug";

export async function connectWS(onMessage) {
  const token = await ensureToken();

  if (!token) {
    console.error("No token available");
    return null;
  }

  const protocol =
    window.location.protocol === "https:"
      ? "wss"
      : "ws";

  const wsUrl =
    `${protocol}://${window.location.host}${config.websocketPath}?token=${encodeURIComponent(token)}`;

  debug("WS URL:", wsUrl);

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    debug("QueueScan WS Connected");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error("WS parse error:", err);
    }
  };

  ws.onclose = (event) => {
    debug("WS disconnected", {
      code: event.code,
      reason: event.reason,
      clean: event.wasClean,
    });
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  return ws;
}
