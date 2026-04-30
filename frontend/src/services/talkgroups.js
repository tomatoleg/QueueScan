import { config } from "../config";
import { apiFetch } from "../services/api";

export async function fetchTalkgroups() {
  const res = await apiFetch("/talkgroups", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to apiFetch talkgroups");
  }

  return await res.json();
}

