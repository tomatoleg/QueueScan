import { ensureToken } from "./auth";
import { config } from "../config";

export async function connectWS(onMessage) {
  const protocol =
    window.location.protocol === "https:" ? "wss" : "ws";

  const backendHost = config.backendUrl
    .replace("http://", "")
    .replace("https://", "");

  const token = await ensureToken();

  console.log("WS TOKEN:", token);

  if (!token) {
    console.error("No token available");
    return null;
  }

  const ws = new WebSocket(
    `${protocol}://${backendHost}${config.websocketPath}?token=${encodeURIComponent(token)}`
  );

  ws.onopen = () => {
    console.log("QueueScan WS Connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onclose = (event) => {
    console.log("WS disconnected", {
      code: event.code,
      reason: event.reason,
      clean: event.wasClean,
    });
  };

  return ws;
}
